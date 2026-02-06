# feature-loop.ps1 - Automated feature implementation loop for Windows
#
# Usage:
#   .\scripts\feature-loop.ps1 -Feature typescript-cleanup
#   .\scripts\feature-loop.ps1 -List
#   .\scripts\feature-loop.ps1 -All
#   .\scripts\feature-loop.ps1 -Feature typescript-cleanup -DryRun
#

param(
    [string]$Feature,
    [switch]$List,
    [switch]$All,
    [switch]$DryRun,
    [switch]$SkipTests,
    [switch]$AutoMerge,
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Continue"
$FeaturesDir = "docs/features"

# === Helper Functions ===

function Write-Log($Message, $Color = "White") {
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step($Message) {
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Test-HasChanges {
    $status = git status --porcelain 2>$null
    return ![string]::IsNullOrEmpty($status)
}

function Test-FeatureExists($Slug) {
    return Test-Path "$FeaturesDir/$Slug.md"
}

function Get-PendingFeatures {
    $readme = Get-Content "$FeaturesDir/README.md" -Raw
    $matches = [regex]::Matches($readme, '\|\s*\[([^\]]+)\].*\|\s*Pending\s*\|')
    return $matches | ForEach-Object { $_.Groups[1].Value }
}

function Invoke-Claude($Prompt) {
    if ($DryRun) {
        Write-Log "[DRY-RUN] Would run: claude -p `"$Prompt`"" Yellow
        return $true
    }

    Write-Log "Running: claude -p `"$Prompt`"" Gray

    try {
        # Use --dangerously-skip-permissions for automated runs
        if ($VerboseOutput) {
            & claude --dangerously-skip-permissions --verbose -p $Prompt
        } else {
            & claude --dangerously-skip-permissions -p $Prompt
        }
        return $true
    } catch {
        Write-Log "Claude command failed: $_" Red
        return $false
    }
}

# === Main Implementation ===

function Implement-Feature($Slug) {
    $branch = "feature/$Slug"

    Write-Step "Implementing Feature: $Slug"

    # Validate
    if (-not (Test-FeatureExists $Slug)) {
        Write-Log "Feature spec not found: $FeaturesDir/$Slug.md" Red
        return $false
    }

    # Step 1: Branch
    Write-Step "Step 1: Create Branch"
    if (-not $DryRun) {
        $null = git checkout main 2>&1
        $null = git pull origin main 2>&1

        $null = git show-ref --verify --quiet "refs/heads/$branch" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Branch exists, checking out..."
            $null = git checkout $branch 2>&1
        } else {
            Write-Log "Creating branch: $branch"
            $null = git checkout -b $branch 2>&1
        }
        Write-Log "On branch: $branch" Green
    }

    # Step 2: Plan
    Write-Step "Step 2: Plan Feature"
    Invoke-Claude "/plan $Slug" | Out-Null

    # Step 3: Execute
    Write-Step "Step 3: Execute Implementation"
    Invoke-Claude "/execute $Slug" | Out-Null

    # Step 4: Tests
    if (-not $SkipTests) {
        Write-Step "Step 4: Add/Run Tests"
        Invoke-Claude "/tests $Slug" | Out-Null
    }

    # Step 5: Commit
    Write-Step "Step 5: Commit Changes"
    if (-not $DryRun -and (Test-HasChanges)) {
        $null = git add -A 2>&1
        $null = git commit -m "feat($Slug): implement feature`n`nCo-Authored-By: Claude <noreply@anthropic.com>" 2>&1
        Write-Log "Changes committed" Green
    } else {
        Write-Log "No changes to commit" Yellow
    }

    # Step 6: PR
    Write-Step "Step 6: Create PR"
    if (-not $DryRun) {
        $null = git push -u origin $branch 2>&1
        if ($LASTEXITCODE -ne 0) {
            $null = git push 2>&1
        }
        Write-Log "Pushed to origin/$branch" Green

        $existingPr = gh pr list --head $branch --json number -q '.[0].number' 2>$null
        if ([string]::IsNullOrEmpty($existingPr)) {
            Invoke-Claude "/pr $Slug" | Out-Null
        } else {
            Write-Log "PR #$existingPr already exists" Yellow
        }
    }

    # Step 7: Review
    Write-Step "Step 7: Review & Fix"
    Invoke-Claude "/review-and-fix" | Out-Null

    if (-not $DryRun -and (Test-HasChanges)) {
        $null = git add -A 2>&1
        $null = git commit -m "fix($Slug): address review feedback`n`nCo-Authored-By: Claude <noreply@anthropic.com>" 2>&1
        $null = git push 2>&1
        Write-Log "Review fixes pushed" Green
    }

    # Step 8: Auto-merge
    if ($AutoMerge -and -not $DryRun) {
        Write-Step "Step 8: Auto-Merge"
        $prNumber = gh pr list --head $branch --json number -q '.[0].number' 2>$null
        if (-not [string]::IsNullOrEmpty($prNumber)) {
            $null = gh pr merge $prNumber --squash --auto 2>&1
            Write-Log "Auto-merge enabled for PR #$prNumber" Green
        }
    }

    # Return to main
    $null = git checkout main 2>&1

    Write-Step "Feature Complete: $Slug"
    return $true
}

# === Show Help ===

function Show-Help {
    Write-Host @"

Usage: .\scripts\feature-loop.ps1 [OPTIONS] -Feature <slug>

Options:
    -Feature <slug>   Feature to implement
    -List             List all pending features
    -All              Implement all pending features
    -DryRun           Preview without executing
    -SkipTests        Skip test generation step
    -AutoMerge        Enable auto-merge after PR
    -VerboseOutput    Show detailed output

Examples:
    .\scripts\feature-loop.ps1 -Feature typescript-cleanup
    .\scripts\feature-loop.ps1 -List
    .\scripts\feature-loop.ps1 -All
    .\scripts\feature-loop.ps1 -DryRun -Feature error-boundaries

"@
}

# === Entry Point ===

Write-Host @"

+-----------------------------------------------------------+
|           Feature Loop - Automated Development            |
+-----------------------------------------------------------+

"@ -ForegroundColor Cyan

# Check prerequisites
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Log "Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code" Red
    exit 1
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Log "GitHub CLI not found. Install from: https://cli.github.com/" Red
    exit 1
}

# Handle modes
if ($List) {
    Write-Step "Pending Features"
    Get-PendingFeatures | ForEach-Object {
        Write-Log "  $_" Cyan
    }
    exit 0
}

if ($All) {
    $features = @(
        "typescript-cleanup"
        "error-boundaries"
        "unit-tests-setup"
        "backend-api-setup"
        "user-authentication"
        "subscription-management"
        "pro-feature-gating"
        "cloud-sync"
        "performance-optimization"
        "notes-widget"
        "vision-board"
    )

    $completed = 0
    $failed = 0

    foreach ($slug in $features) {
        if (Test-FeatureExists $slug) {
            if (Implement-Feature $slug) {
                $completed++
            } else {
                $failed++
                Write-Log "Failed on $slug, stopping." Red
                break
            }
        }
    }

    Write-Step "Summary"
    Write-Log "Completed: $completed"
    Write-Log "Failed: $failed"
    exit 0
}

if ([string]::IsNullOrEmpty($Feature)) {
    Write-Log "No feature specified. Use -List to see pending features." Red
    Show-Help
    exit 1
}

if ($DryRun) {
    Write-Log "DRY RUN MODE - No changes will be made" Yellow
}

Implement-Feature $Feature

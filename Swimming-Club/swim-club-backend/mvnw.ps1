#!/usr/bin/env pwsh
# Maven wrapper script for Windows PowerShell

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$MavenArgs
)

$DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$JAVA_EXE = "java.exe"

# Check if java exists
$javaCheck = Get-Command $JAVA_EXE -ErrorAction SilentlyContinue
if (-not $javaCheck) {
    Write-Error "ERROR: java.exe not found. Please install Java or set JAVA_HOME"
    exit 1
}

# Prepare Maven wrapper jar path
$WRAPPER_JAR = "$DIR\.mvn\wrapper\maven-wrapper.jar"

if (-not (Test-Path $WRAPPER_JAR)) {
    Write-Error "ERROR: Maven wrapper jar not found at $WRAPPER_JAR"
    exit 1
}

# Prepare Maven wrapper properties path
$WRAPPER_PROPS = "$DIR\.mvn\wrapper\maven-wrapper.properties"

# Execute Maven
Write-Host "Running Maven with arguments: $($MavenArgs -join ' ')"
& $JAVA_EXE "-Dmaven.multiModuleProjectDirectory=$DIR" "--add-opens" "java.base/java.lang=ALL-UNNAMED" "--add-opens" "java.base/java.io=ALL-UNNAMED" "--add-opens" "java.base/java.util=ALL-UNNAMED" -classpath "$WRAPPER_JAR" org.apache.maven.wrapper.MavenWrapperMain @MavenArgs

exit $LASTEXITCODE


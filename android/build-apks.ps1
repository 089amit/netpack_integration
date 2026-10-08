# NetPack Logistics - Dual APK Compilation & Signing Engine
$ErrorActionPreference = "Stop"

$JAVA_HOME = "C:\Users\Postronix\.bubblewrap\jdk\jdk-17.0.11+9"
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"

$SDK_DIR = "C:\Users\Postronix\.bubblewrap\android_sdk"
$BUILD_TOOLS = "$SDK_DIR\build-tools\34.0.0"
$AAPT2 = "$BUILD_TOOLS\aapt2.exe"
$D8 = "$BUILD_TOOLS\d8.bat"
$ZIPALIGN = "$BUILD_TOOLS\zipalign.exe"
$APKSIGNER = "$BUILD_TOOLS\apksigner.bat"
$ANDROID_JAR = "$SDK_DIR\platforms\android-34\android.jar"
$JAVAC = "$JAVA_HOME\bin\javac.exe"
$JAR = "$JAVA_HOME\bin\jar.exe"
$KEYTOOL = "$JAVA_HOME\bin\keytool.exe"
$JARSIGNER = "$JAVA_HOME\bin\jarsigner.exe"

$ROOT_DIR = (Get-Item .).FullName
$KEYSTORE = "$ROOT_DIR\android\keystore\netpack.keystore"
$KS_PASS = "netpack2026"
$KS_ALIAS = "netpack"

# 1. Ensure Keystore exists
if (!(Test-Path $KEYSTORE)) {
    Write-Host "Creating signing keystore..." -ForegroundColor Cyan
    & $KEYTOOL -genkeypair -keystore $KEYSTORE -storepass $KS_PASS -keypass $KS_PASS -alias $KS_ALIAS -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=NetPack Logistics, OU=Mobile, O=NetPack, L=Kathmandu, C=NP"
}

New-Item -ItemType Directory -Force -Path "$ROOT_DIR\build-apk" | Out-Null

function Build-App {
    param (
        [string]$AppName,
        [string]$AppDir,
        [string]$PackageName,
        [string]$OutputApk
    )

    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "Building $AppName APK ($PackageName)..." -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green

    $GEN = "$AppDir\gen"
    $OBJ = "$AppDir\obj"
    $BIN = "$AppDir\bin"
    $COMPILED_RES = "$AppDir\compiled_res.zip"
    $UNALIGNED_RES = "$AppDir\unaligned_res.apk"
    $ALIGNED_TEMP = "$AppDir\aligned_temp.apk"

    # Clean previous build artifacts
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $GEN, $OBJ, $BIN, $COMPILED_RES, $UNALIGNED_RES, $ALIGNED_TEMP
    New-Item -ItemType Directory -Force -Path $GEN, $OBJ, $BIN | Out-Null

    # Step 1: Compile Android resources
    Write-Host "1. Compiling resources with aapt2..." -ForegroundColor Yellow
    & $AAPT2 compile --dir "$AppDir\res" -o $COMPILED_RES
    if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed for $AppName" }

    # Step 2: Link resources and generate R.java
    Write-Host "2. Linking resources and generating R.java..." -ForegroundColor Yellow
    & $AAPT2 link $COMPILED_RES -I $ANDROID_JAR --manifest "$AppDir\AndroidManifest.xml" --min-sdk-version 21 --target-sdk-version 34 --java $GEN -o $UNALIGNED_RES --auto-add-overlay
    if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed for $AppName" }

    # Step 3: Compile Java source files
    Write-Host "3. Compiling Java sources with javac..." -ForegroundColor Yellow
    $javaFiles = Get-ChildItem -Path "$AppDir\src", $GEN -Recurse -Filter *.java | ForEach-Object { $_.FullName }
    & $JAVAC -encoding UTF-8 -cp "$ANDROID_JAR;$GEN" -d $OBJ $javaFiles
    if ($LASTEXITCODE -ne 0) { throw "javac compilation failed for $AppName" }

    # Step 4: Dex classes into classes.dex
    Write-Host "4. Dexing bytecode with d8..." -ForegroundColor Yellow
    $classFiles = Get-ChildItem -Path $OBJ -Recurse -Filter *.class | ForEach-Object { $_.FullName }
    & $D8 --min-api 21 --lib $ANDROID_JAR --output $BIN $classFiles
    if ($LASTEXITCODE -ne 0) { throw "d8 failed for $AppName" }

    # Step 5: Add classes.dex into APK archive
    Write-Host "5. Packaging classes.dex into APK..." -ForegroundColor Yellow
    & $JAR uf $UNALIGNED_RES -C $BIN classes.dex
    if ($LASTEXITCODE -ne 0) { throw "jar packaging failed for $AppName" }

    # Step 6: JAR Signing with jarsigner (v1 JAR signature)
    Write-Host "6. Signing with jarsigner (v1 JAR scheme)..." -ForegroundColor Yellow
    & $JARSIGNER -keystore $KEYSTORE -storepass $KS_PASS -keypass $KS_PASS -sigalg SHA256withRSA -digestalg SHA-256 $UNALIGNED_RES $KS_ALIAS
    if ($LASTEXITCODE -ne 0) { throw "jarsigner failed for $AppName" }

    # Step 7: 4-byte Zipalign
    Write-Host "7. Aligning APK with zipalign..." -ForegroundColor Yellow
    & $ZIPALIGN -f -p 4 $UNALIGNED_RES $ALIGNED_TEMP
    if ($LASTEXITCODE -ne 0) { throw "zipalign failed for $AppName" }

    # Step 8: Cryptographically Sign APK (v1, v2, v3 schemes)
    Write-Host "8. Signing APK with apksigner (v1, v2, v3 schemes)..." -ForegroundColor Yellow
    & $APKSIGNER sign --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --min-sdk-version 21 --ks $KEYSTORE --ks-pass "pass:$KS_PASS" --ks-key-alias $KS_ALIAS --out "$ROOT_DIR\build-apk\$OutputApk" $ALIGNED_TEMP
    if ($LASTEXITCODE -ne 0) { throw "apksigner failed for $AppName" }

    # Step 9: Verify Signature
    Write-Host "9. Verifying APK signature..." -ForegroundColor Yellow
    & $APKSIGNER verify --verbose "$ROOT_DIR\build-apk\$OutputApk"

    Write-Host "[SUCCESS] $AppName APK ready at build-apk\$OutputApk" -ForegroundColor Green
}

# Build Customer App
Build-App -AppName "NetPack Customer" `
          -AppDir "$ROOT_DIR\android\customer" `
          -PackageName "com.netpacklogistic.app" `
          -OutputApk "Netpack-Customer.apk"

# Build Rider App
Build-App -AppName "NetPack Rider" `
          -AppDir "$ROOT_DIR\android\rider" `
          -PackageName "com.netpacklogistic.rider" `
          -OutputApk "Netpack-Rider.apk"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "🎉 Both APKs compiled, aligned, and signed successfully!" -ForegroundColor Cyan
Write-Host "Deliverables:" -ForegroundColor Cyan
Get-ChildItem -Path "$ROOT_DIR\build-apk\*.apk" | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

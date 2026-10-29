# NetPack Logistic - Dual Android App Bundle (.aab) Compilation & Signing Engine
$ErrorActionPreference = "Stop"

$JAVA_HOME = "C:\Users\Postronix\.bubblewrap\jdk\jdk-17.0.11+9"
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"

$SDK_DIR = "C:\Users\Postronix\.bubblewrap\android_sdk"
$BUILD_TOOLS = "$SDK_DIR\build-tools\34.0.0"
$AAPT2 = "$BUILD_TOOLS\aapt2.exe"
$D8 = "$BUILD_TOOLS\d8.bat"
$ANDROID_JAR = "$SDK_DIR\platforms\android-34\android.jar"
$JAVAC = "$JAVA_HOME\bin\javac.exe"
$JAVA = "$JAVA_HOME\bin\java.exe"
$JARSIGNER = "$JAVA_HOME\bin\jarsigner.exe"

$ROOT_DIR = (Get-Item .).FullName
$BUNDLETOOL = "$ROOT_DIR\android\tools\bundletool.jar"
$KEYSTORE = "$ROOT_DIR\android\keystore\netpack.keystore"
$KS_PASS = "netpack2026"
$KS_ALIAS = "netpack"

New-Item -ItemType Directory -Force -Path "$ROOT_DIR\build-aab" | Out-Null

function Build-Aab {
    param (
        [string]$AppName,
        [string]$AppDir,
        [string]$PackageName,
        [string]$OutputAab
    )

    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "Building $AppName AAB ($PackageName)..." -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green

    $GEN = "$AppDir\gen"
    $OBJ = "$AppDir\obj"
    $BIN = "$AppDir\bin"
    $COMPILED_RES = "$AppDir\compiled_res.zip"
    $UNALIGNED_RES = "$AppDir\unaligned_res.apk"
    $PROTO_APK = "$AppDir\base_proto.apk"
    $BASE_ZIP = "$AppDir\base.zip"
    $TEMP_DIR = "$AppDir\aab_temp"

    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $GEN, $OBJ, $BIN, $COMPILED_RES, $UNALIGNED_RES, $PROTO_APK, $BASE_ZIP, $TEMP_DIR
    New-Item -ItemType Directory -Force -Path $GEN, $OBJ, $BIN, $TEMP_DIR | Out-Null

    # 1. Compile resources
    Write-Host "1. Compiling resources with aapt2..." -ForegroundColor Yellow
    & $AAPT2 compile --dir "$AppDir\res" -o $COMPILED_RES
    if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed for $AppName" }

    # 2. Link resources and generate R.java
    Write-Host "2. Generating R.java..." -ForegroundColor Yellow
    & $AAPT2 link $COMPILED_RES -I $ANDROID_JAR --manifest "$AppDir\AndroidManifest.xml" --min-sdk-version 21 --target-sdk-version 34 --java $GEN -o $UNALIGNED_RES --auto-add-overlay
    if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed for $AppName" }

    # 3. Compile Java sources
    Write-Host "3. Compiling Java sources with javac..." -ForegroundColor Yellow
    $javaFiles = Get-ChildItem -Path "$AppDir\src", $GEN -Recurse -Filter *.java | ForEach-Object { $_.FullName }
    & $JAVAC -encoding UTF-8 -cp "$ANDROID_JAR;$GEN" -d $OBJ $javaFiles
    if ($LASTEXITCODE -ne 0) { throw "javac compilation failed for $AppName" }

    # 4. Dex classes into classes.dex
    Write-Host "4. Dexing bytecode with d8..." -ForegroundColor Yellow
    $classFiles = Get-ChildItem -Path $OBJ -Recurse -Filter *.class | ForEach-Object { $_.FullName }
    & $D8 --min-api 21 --lib $ANDROID_JAR --output $BIN $classFiles
    if ($LASTEXITCODE -ne 0) { throw "d8 failed for $AppName" }

    # 5. Link proto format for AAB
    Write-Host "5. Linking resources in protobuf format for AAB..." -ForegroundColor Yellow
    & $AAPT2 link --proto-format -o $PROTO_APK -I $ANDROID_JAR --manifest "$AppDir\AndroidManifest.xml" --min-sdk-version 21 --target-sdk-version 34 $COMPILED_RES --auto-add-overlay
    if ($LASTEXITCODE -ne 0) { throw "aapt2 proto link failed for $AppName" }

    # 6. Unpack and restructure into base module zip
    Write-Host "6. Structuring base module..." -ForegroundColor Yellow
    Expand-Archive -Path $PROTO_APK -DestinationPath $TEMP_DIR -Force
    New-Item -ItemType Directory -Force -Path "$TEMP_DIR\manifest", "$TEMP_DIR\dex" | Out-Null
    Move-Item "$TEMP_DIR\AndroidManifest.xml" "$TEMP_DIR\manifest\AndroidManifest.xml" -Force
    Copy-Item "$BIN\classes.dex" "$TEMP_DIR\dex\classes.dex" -Force

    if (Test-Path $BASE_ZIP) { Remove-Item -Force $BASE_ZIP }
    Compress-Archive -Path "$TEMP_DIR\*" -DestinationPath $BASE_ZIP -Force

    # 7. Build App Bundle with bundletool
    Write-Host "7. Building App Bundle with bundletool..." -ForegroundColor Yellow
    $OUT_AAB_PATH = "$ROOT_DIR\build-aab\$OutputAab"
    if (Test-Path $OUT_AAB_PATH) { Remove-Item -Force $OUT_AAB_PATH }
    & $JAVA -jar $BUNDLETOOL build-bundle --modules=$BASE_ZIP --output=$OUT_AAB_PATH
    if ($LASTEXITCODE -ne 0) { throw "bundletool build-bundle failed for $AppName" }

    # 8. Sign AAB with jarsigner
    Write-Host "8. Signing AAB with jarsigner..." -ForegroundColor Yellow
    & $JARSIGNER -keystore $KEYSTORE -storepass $KS_PASS -keypass $KS_PASS -sigalg SHA256withRSA -digestalg SHA-256 $OUT_AAB_PATH $KS_ALIAS
    if ($LASTEXITCODE -ne 0) { throw "jarsigner failed for $AppName" }

    Write-Host "[SUCCESS] $AppName AAB ready at build-aab\$OutputAab" -ForegroundColor Green
}

# Build Customer App Bundle
Build-Aab -AppName "NetPack Customer" `
          -AppDir "$ROOT_DIR\android\customer" `
          -PackageName "com.netpacklogistic.app" `
          -OutputAab "Netpack-Customer.aab"

# Build Rider App Bundle
Build-Aab -AppName "NetPack Rider" `
          -AppDir "$ROOT_DIR\android\rider" `
          -PackageName "com.netpacklogistic.rider" `
          -OutputAab "Netpack-Rider.aab"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "🎉 Both App Bundles (.aab) compiled and signed successfully!" -ForegroundColor Cyan
Write-Host "Deliverables for Google Play Console:" -ForegroundColor Cyan
Get-ChildItem -Path "$ROOT_DIR\build-aab\*.aab" | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

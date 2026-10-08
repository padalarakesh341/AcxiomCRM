@echo off
echo ========================================================
echo   AcxiomCRM - GitHub Push Helper
echo ========================================================
echo.
echo Make sure you have created an empty repository on GitHub:
echo https://github.com/new
echo Repository name: AcxiomCRM
echo.
pause
echo Pushing to https://github.com/padalarakesh341/AcxiomCRM.git ...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
  echo Successfully pushed AcxiomCRM to GitHub!
) else (
  echo Push failed. Please check that the repository exists and you have write permissions.
)
pause

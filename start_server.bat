@echo off
call venv\Scripts\activate.bat
python app\main.py > stdout.txt 2>&1

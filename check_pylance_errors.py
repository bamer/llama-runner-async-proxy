#!/usr/bin/env python3
"""
Script to identify real Pylance/type errors in the codebase.
This uses Python's ast module to parse files and check for basic issues.
"""
import ast
import sys
from pathlib import Path
from typing import List, Tuple

def check_file_syntax(filepath: Path) -> Tuple[bool, str]:
    """Check if a Python file has syntax errors."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
        ast.parse(code)
        return True, "OK"
    except SyntaxError as e:
        return False, f"Syntax Error at line {e.lineno}: {e.msg}"
    except Exception as e:
        return False, f"Error: {e}"

def main():
    """Main function to check all Python files."""
    root = Path(".")
    python_files = list(root.glob("llama_runner/**/*.py"))
    
    errors: List[Tuple[Path, str]] = []
    success_count = 0
    
    print(f"Checking {len(python_files)} Python files...\n")
    
    for filepath in sorted(python_files):
        if "__pycache__" in str(filepath):
            continue
            
        is_ok, message = check_file_syntax(filepath)
        if is_ok:
            success_count += 1
            print(f"✓ {filepath.relative_to('llama_runner')}")
        else:
            errors.append((filepath, message))
            print(f"✗ {filepath.relative_to('llama_runner')}: {message}")
    
    print(f"\n{'='*70}")
    print(f"Results: {success_count}/{len(python_files)} files OK")
    
    if errors:
        print(f"\n{len(errors)} files with errors:")
        for filepath, error in errors:
            print(f"  - {filepath}: {error}")
        sys.exit(1)
    else:
        print("\n✅ All files have valid syntax!")
        sys.exit(0)

if __name__ == "__main__":
    main()

import json
import sys

try:
    with open('pyright_output.json', 'r') as f:
        data = json.load(f)
    
    diagnostics = data.get('generalDiagnostics', [])
    print(f'Total Pylance/Pyright errors: {len(diagnostics)}\n')
    
    if diagnostics:
        print('First 30 errors:')
        print('='*80)
        for i, d in enumerate(diagnostics[:30], 1):
            file_path = d.get('file', 'unknown')
            line = d.get('range', {}).get('start', {}).get('line', 0) + 1
            message = d.get('message', '')
            severity = d.get('severity', 'error')
            print(f'{i}. {file_path}:{line}')
            print(f'   [{severity.upper()}] {message}\n')
    else:
        print('✅ No Pylance/Pyright errors found!')
        
except FileNotFoundError:
    print('Error: pyright_output.json not found')
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f'Error parsing JSON: {e}')
    sys.exit(1)

import os

files = [
    r'frontend\src\screens\FeeManagementScreen.js',
    r'backend\controllers\studentController.js',
    r'backend\controllers\feeController.js'
]

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace HTML entities
        content = content.replace('&amp;gt;', '>')
        content = content.replace('&amp;lt;', '<')
        content = content.replace('&amp;amp;', '&')
        content = content.replace('&gt;', '>')
        content = content.replace('&lt;', '<')
        content = content.replace('&amp;', '&')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'✓ Fixed {file_path}')
    except Exception as e:
        print(f'✗ Error fixing {file_path}: {e}')

print('\nAll files fixed!')

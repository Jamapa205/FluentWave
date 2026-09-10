import re
with open('src/app.ts', 'r') as f:
    code = f.read()

# Make route handlers async if not already
code = re.sub(r'app\.(get|post)\(([^,]+),\s*\(_req: Request,\s*res: Response\)\s*=>\s*{', r'app.\1(\2, async (_req: Request, res: Response) => {', code)
code = re.sub(r'app\.(get|post)\(([^,]+),\s*\(req: Request,\s*res: Response\)\s*=>\s*{', r'app.\1(\2, async (req: Request, res: Response) => {', code)

# Prepend await to store methods
store_methods = ['saveUser', 'findUserByEmailOrPhone', 'saveStudent', 'getStudent', 'getAllStudents', 'saveAssessment', 'getAssessment', 'initializeChecklist', 'getDocuments', 'updateDocument', 'logEvent', 'getEvents', 'transitionStudent']

for method in store_methods:
    code = re.sub(r'(?<!await )store\.' + method + r'\(', r'await store.' + method + '(', code)

with open('src/app.ts', 'w') as f:
    f.write(code)

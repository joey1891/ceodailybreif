import os
import re
import streamlit as st
from collections import defaultdict
import time
import json
from datetime import datetime

# Database directory for storing JSON files
DB_DIR = "function_data"

# Cache to store previously read file contents
file_cache = {}
json_cache = {}

# Custom CSS to reduce line height and increase information density
st.markdown("""
<style>
    .compact-text p {
        margin-bottom: 0.3rem !important;
        line-height: 1.1 !important;
    }
    .small-expander .streamlit-expanderHeader {
        font-size: 0.9rem !important;
        padding: 0.2rem !important;
    }
    .folder-header {
        margin-bottom: 0.5rem !important;
        margin-top: 0.5rem !important;
    }
    .file-header {
        margin-bottom: 0.3rem !important;
        margin-top: 0.3rem !important;
    }
    .usage-item {
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
    }
    .description-area {
        margin-top: 0.5rem !important;
        margin-bottom: 0.5rem !important;
    }
    .last-updated {
        font-size: 0.8rem;
        color: #888;
        font-style: italic;
    }
    .path-check {
        font-size: 0.9rem;
        color: #4CAF50;
        margin-bottom: 0.5rem !important;
    }
    .path-error {
        font-size: 0.9rem;
        color: #F44336;
        margin-bottom: 0.5rem !important;
    }
</style>
""", unsafe_allow_html=True)

st.title('Function Usage Finder')

# Function to generate a safe key for Streamlit widgets
def generate_safe_key(prefix, function_name, file_path=None):
    # Replace special characters and create a sanitized key
    if file_path:
        # Replace backslashes, brackets and other special characters
        safe_path = re.sub(r'[\\/\[\]\(\)\{\}\s]', '_', file_path)
        # Limit length to avoid excessively long keys
        path_part = safe_path[-40:] if len(safe_path) > 40 else safe_path
        return f"{prefix}_{function_name}_{path_part}_{hash(file_path) % 10000}"
    else:
        return f"{prefix}_{function_name}_{hash(function_name) % 10000}"

# Function definition patterns (JavaScript/TypeScript)
FUNCTION_PATTERNS = [
    r"function\s+(\w+)",  # function name()
    r"const\s+(\w+)\s*=\s*\([^)]*\)\s*=>",  # const name = () =>
    r"const\s+(\w+)\s*=\s*function",  # const name = function
    r"export\s+function\s+(\w+)",  # export function name()
    r"export\s+const\s+(\w+)\s*=\s*\([^)]*\)\s*=>",  # export const name = () =>
    r"class\s+(\w+)",  # class Name
    r"export\s+class\s+(\w+)",  # export class Name
    r"export\s+default\s+function\s+(\w+)",  # export default function Name
    r"function\*\s+(\w+)",  # generator function* name()
    r"async\s+function\s+(\w+)",  # async function name()
    r"export\s+async\s+function\s+(\w+)",  # export async function name()
    r"export\s+default\s+async\s+function\s+(\w+)",  # export default async function name()
    r"export\s+default\s+class\s+(\w+)"  # export default class Name
]

# Import patterns
IMPORT_PATTERNS = [
    r"import\s+.*?from\s+['\"]([^'\"]+)['\"]",  # import x from 'module'
    r"require\(['\"]([^'\"]+)['\"]"  # require('module')
]

# Export patterns
EXPORT_PATTERNS = [
    r"export\s+default",  # export default ...
    r"export\s+\{([^}]+)\}"  # export { x, y, z }
]

# Get JSON file path for a source file
def get_json_file_path(source_file_path):
    # Create a path that mirrors the source file structure
    relative_path = source_file_path
    json_file_path = os.path.join(DB_DIR, relative_path + ".json")
    return json_file_path

# Check if JSON file exists for a given source file
def check_json_file_exists(source_file_path):
    json_path = get_json_file_path(source_file_path)
    return os.path.exists(json_path)

# Load data for a specific file
def load_file_data(file_path):
    json_path = get_json_file_path(file_path)
    
    if json_path in json_cache:
        return json_cache[json_path]
    
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                json_cache[json_path] = data
                return data
        except Exception as e:
            st.error(f"Error processing {json_path}: {e}")
    
    # Return empty data structure if file doesn't exist
    return {
        "functions": {},
        "imports": [],
        "exports": [],
        "last_updated": datetime.now().isoformat()
    }

# Find all files of a certain type in directories
def find_files(directories, extensions=('.ts', '.tsx', '.js', '.jsx', '.py')):
    all_files = []
    for directory in directories:
        for root, _, files in os.walk(directory):
            # Skip excluded directories
            if any(excluded in root for excluded in ["node_modules", ".git", ".next", "build", "dist"]):
                continue
                
            for file in files:
                if file.endswith(extensions):
                    file_path = os.path.join(root, file)
                    all_files.append(file_path)
    return all_files

# Build folder tree
def build_folder_tree(directories):
    folder_tree = defaultdict(list)
    
    for directory in directories:
        for root, _, files in os.walk(directory):
            # Skip excluded directories
            if any(excluded in root for excluded in ["node_modules", ".git", ".next", "build", "dist"]):
                continue
                
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.py')):
                    file_path = os.path.join(root, file)
                    folder = os.path.dirname(file_path)
                    folder_tree[folder].append(file_path)
    
    return folder_tree

# Find all usages of a function in directories
def find_function_usages(function_name, directories):
    usages = []
    potential_calls = 0
    
    for directory in directories:
        for root, _, files in os.walk(directory):
            # Skip excluded directories
            if any(excluded in root for excluded in ["node_modules", ".git", ".next", "build", "dist"]):
                continue
                
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.py')):
                    file_path = os.path.join(root, file)
                    
                    # Use cache if available
                    if file_path in file_cache:
                        file_content = file_cache[file_path]
                    else:
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                file_content = f.read()
                                file_cache[file_path] = file_content
                        except Exception:
                            continue
                    
                    # Find all occurrences by line number
                    lines = file_content.split('\n')
                    for i, line in enumerate(lines):
                        # Look for function calls (more precise than just name occurrence)
                        fn_pattern = r'\b' + re.escape(function_name) + r'\s*\('
                        if re.search(fn_pattern, line):
                            usages.append({"file": file_path, "line": i + 1})
                            potential_calls += 1
                        # Also check for JSX usage like <FunctionName />
                        jsx_pattern = r'<\s*' + re.escape(function_name) + r'\s*[>/]'
                        if re.search(jsx_pattern, line):
                            usages.append({"file": file_path, "line": i + 1})
                            potential_calls += 1
    
    return usages, potential_calls

# Load all data
def load_all_data():
    all_functions = {}
    path_check_results = []
    
    if not os.path.exists(DB_DIR):
        return all_functions, path_check_results
    
    # Walk through all JSON files in the DB_DIR
    for root, _, files in os.walk(DB_DIR):
        for file in files:
            if file.endswith('.json'):
                json_path = os.path.join(root, file)
                source_path = json_path[len(DB_DIR)+1:-5]  # Remove DB_DIR prefix and .json suffix
                
                # Check if source file exists
                source_exists = os.path.exists(source_path)
                
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Add function data with source info
                    for func_name, func_data in data.get("functions", {}).items():
                        if func_name not in all_functions:
                            all_functions[func_name] = {"sources": [], "usages": []}
                        
                        if source_path not in all_functions[func_name]["sources"]:
                            all_functions[func_name]["sources"].append(source_path)
                        
                        # Add usages
                        usages = func_data.get("usages", [])
                        all_functions[func_name]["usages"].extend(usages)
                        
                    # Record path check results
                    path_check_results.append({
                        "json_path": json_path,
                        "source_path": source_path,
                        "source_exists": source_exists,
                        "functions": list(data.get("functions", {}).keys())
                    })
                    
                except Exception as e:
                    st.error(f"Error reading {json_path}: {e}")
    
    return all_functions, path_check_results

# Scan project directories (read-only, no updates)
def scan_project(directories):
    start_time = time.time()
    
    # Initialize empty database structures
    function_sources = defaultdict(list)
    file_functions = defaultdict(list)
    
    # Step 1: Setup progress indicators
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    # Step 2: Find all relevant files
    status_text.text("Finding files to analyze...")
    all_files = find_files(directories)
    
    total_files = len(all_files)
    if total_files == 0:
        status_text.text("No files found to analyze.")
        return {}, {}, {}
    
    # Step 3: Extract functions, imports, and exports from each file
    for i, file_path in enumerate(all_files):
        # Update progress
        progress = (i+1) / total_files
        progress_bar.progress(progress)
        status_text.text(f"Analyzing {i+1}/{total_files}: {file_path}")
        
        # Extract function definitions, imports, and exports from this file
        file_content = None
        try:
            if file_path in file_cache:
                file_content = file_cache[file_path]
            else:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    file_content = f.read()
                    file_cache[file_path] = file_content
        except Exception as e:
            status_text.text(f"Error reading {file_path}: {e}")
            continue
        
        # Extract functions
        functions_found = []
        for pattern in FUNCTION_PATTERNS:
            matches = re.findall(pattern, file_content)
            functions_found.extend(matches)
        
        # Extract imports
        imports_found = []
        for pattern in IMPORT_PATTERNS:
            matches = re.findall(pattern, file_content)
            imports_found.extend(matches)
        
        # Extract exports
        exports_found = []
        for pattern in EXPORT_PATTERNS:
            matches = re.findall(pattern, file_content)
            # Handle the export { x, y, z } case
            for match in matches:
                if isinstance(match, str) and ',' in match:
                    exports_found.extend([item.strip() for item in match.split(',')])
                else:
                    exports_found.append(match.strip() if isinstance(match, str) else match)
        
        # Check if JSON file exists for this source file
        json_exists = check_json_file_exists(file_path)
        
        # Update our in-memory mappings
        for function_name in functions_found:
            function_sources[function_name].append(file_path)
            file_functions[file_path].append(function_name)
    
    # Step 4: Complete
    elapsed_time = time.time() - start_time
    status_text.text(f"Scan completed in {elapsed_time:.2f} seconds.")
    
    # Load existing data to compare
    all_functions, path_check_results = load_all_data()
    
    return function_sources, file_functions, {"functions": all_functions, "path_checks": path_check_results}

# Sidebar for configuration
with st.sidebar:
    st.header("Configuration")
    
    # Directory input
    directory_input = st.text_input("Enter directories to scan (comma-separated)", "./app,./components,./lib,./hooks")
    directories = [dir.strip() for dir in directory_input.split(',') if dir.strip()]
    
    # Search filters
    st.subheader("Search Filters")
    search_term = st.text_input("Search functions")
    
    # Scan/Update button
    if st.button("Scan Project (Read-only)"):
        function_sources, file_functions, database = scan_project(directories)
        st.session_state.function_sources = function_sources
        st.session_state.file_functions = file_functions
        st.session_state.database = database
        st.session_state.last_update = datetime.now().isoformat()
    
    # Display last update time
    if 'last_update' in st.session_state:
        st.markdown(f"<div class='last-updated'>Last scanned: {st.session_state.last_update}</div>", unsafe_allow_html=True)

# Initialize session state for database
if 'database' not in st.session_state:
    # Load existing data
    all_functions, path_check_results = load_all_data()
    st.session_state.database = {"functions": all_functions, "path_checks": path_check_results}
    st.session_state.function_sources = defaultdict(list)
    st.session_state.file_functions = defaultdict(list)

# Get data from session state
all_functions = st.session_state.database.get("functions", {})
path_check_results = st.session_state.database.get("path_checks", [])

# Filter functions based on search term
filtered_functions = {}
if search_term:
    for function_name, function_data in all_functions.items():
        if search_term.lower() in function_name.lower():
            filtered_functions[function_name] = function_data
else:
    filtered_functions = all_functions

# Main interface with tabs
tab1, tab2, tab3, tab4 = st.tabs(["Project Structure", "Function List", "Imports & Exports", "Path Check"])

with tab1:  # Project Structure View
    st.header("Project Structure")
    
    if 'function_sources' in st.session_state and st.session_state.function_sources:
        # Build folder tree
        folder_tree = build_folder_tree(directories)
        
        for folder, files in sorted(folder_tree.items()):
            with st.expander(f"📁 {folder}", expanded=False):
                for file_path in sorted(files):
                    file_name = os.path.basename(file_path)
                    
                    # Load existing data for this file
                    file_data = load_file_data(file_path)
                    functions_in_file = file_data.get("functions", {})
                    
                    # Display file with function count
                    st.markdown(f"<b>📄 {file_name}</b> ({len(functions_in_file)} functions)", unsafe_allow_html=True)
                    
                    # Display functions in this file
                    if functions_in_file:
                        for func_name, func_data in sorted(functions_in_file.items()):
                            # Display function with description and usage count
                            description = func_data.get("description", "")
                            usage_count = len(func_data.get("usages", []))
                            
                            # Function name and usage count
                            st.markdown(f"<div class='compact-text'><b>{func_name}</b> ({usage_count} usages)</div>", unsafe_allow_html=True)
                            
                            # Description display only (no editing)
                            if description:
                                st.markdown(f"<div class='compact-text' style='margin-left: 20px;'><i>{description}</i></div>", unsafe_allow_html=True)
                            
                            # Usages
                            usages = func_data.get("usages", [])
                            if usages:
                                with st.expander(f"Usages ({len(usages)})", expanded=False):
                                    st.markdown("<div class='compact-text'>", unsafe_allow_html=True)
                                    for usage in usages:
                                        st.markdown(f"<div class='usage-item'>- {usage['file']}:{usage['line']}</div>", unsafe_allow_html=True)
                                    st.markdown("</div>", unsafe_allow_html=True)
    else:
        st.info("Please scan the project to view the structure.")

with tab2:  # Function List View
    st.header("Function List")
    
    # 함수 목록을 알파벳 순으로 정렬
    sorted_functions = sorted(filtered_functions.items(), key=lambda x: x[0])
    
    if sorted_functions:
        # 검색 결과 개수 표시
        st.write(f"Found {len(sorted_functions)} functions")
        
        # 모든 함수를 전체 펼쳐진 목록으로 표시
        for function_name, function_data in sorted_functions:
            # 함수 이름을 헤더로 표시
            st.markdown(f"### `{function_name}`")
            
            # 정의된 경로 (소스 파일) - 들여쓰기 1단계
            sources = function_data.get("sources", [])
            if sources:
                st.markdown("**Defined in:**")
                for source in sources:
                    st.markdown(f"&nbsp;&nbsp;&nbsp;&nbsp;📄 `{source}`")
            
            # 설명 - 들여쓰기 1단계
            description = ""
            if sources:
                first_source = sources[0]
                source_data = load_file_data(first_source)
                description = source_data.get("functions", {}).get(function_name, {}).get("description", "")
            
            if description:
                st.markdown("**Description:**")
                st.markdown(f"&nbsp;&nbsp;&nbsp;&nbsp;ℹ️ *{description}*")
            
            # 사용처 - 들여쓰기 1단계, 각 사용처는 2단계
            all_usages = []
            for source in sources:
                source_data = load_file_data(source)
                usages = source_data.get("functions", {}).get(function_name, {}).get("usages", [])
                all_usages.extend(usages)
            
            if all_usages:
                st.markdown(f"**Used in:** ({len(all_usages)} places)")
                # 사용처를 그룹화 (파일별로)
                usage_by_file = defaultdict(list)
                for usage in all_usages:
                    usage_by_file[usage['file']].append(usage['line'])
                
                # 파일별로 정렬하여 표시
                for file, lines in sorted(usage_by_file.items()):
                    st.markdown(f"&nbsp;&nbsp;&nbsp;&nbsp;📂 `{file}`")
                    lines_str = ", ".join(str(line) for line in sorted(lines))
                    st.markdown(f"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📝 Lines: {lines_str}")
            else:
                st.markdown("**Used in:** No usages found")
            
            # 구분선 추가
            st.markdown("---")
    else:
        st.info("No functions match your search criteria")

with tab3:  # Imports & Exports View
    st.header("Imports & Exports")
    
    # Build folder tree
    folder_tree = build_folder_tree(directories)
    
    for folder, files in sorted(folder_tree.items()):
        st.markdown(f"<h3 class='folder-header'>📁 {folder}</h3>", unsafe_allow_html=True)
        
        for file_path in sorted(files):
            file_name = os.path.basename(file_path)
            
            # Load data for this file
            file_data = load_file_data(file_path)
            
            # Count imports and exports
            import_count = len(file_data.get("imports", []))
            export_count = len(file_data.get("exports", []))
            
            # Show file name with counts
            st.markdown(f"<h4 class='file-header'>📄 {file_name} (📥 {import_count} | 📤 {export_count})</h4>", unsafe_allow_html=True)
            
            # Display imports for this file
            imports = file_data.get("imports", [])
            if imports:
                with st.expander("📥 Imports", expanded=False):
                    st.markdown("<div class='compact-text'>", unsafe_allow_html=True)
                    for imp in sorted(imports):
                        st.markdown(f"<div class='usage-item'>- {imp}</div>", unsafe_allow_html=True)
                    st.markdown("</div>", unsafe_allow_html=True)
            
            # Display exports for this file
            exports = file_data.get("exports", [])
            if exports:
                with st.expander("📤 Exports", expanded=False):
                    st.markdown("<div class='compact-text'>", unsafe_allow_html=True)
                    for exp in sorted(exports):
                        st.markdown(f"<div class='usage-item'>- {exp}</div>", unsafe_allow_html=True)
                    st.markdown("</div>", unsafe_allow_html=True)

with tab4:  # Path Check
    st.header("Path Check")
    
    # Display path check results
    if path_check_results:
        st.write(f"Found {len(path_check_results)} JSON files in the database directory")
        
        # Count valid and invalid paths
        valid_paths = sum(1 for result in path_check_results if result["source_exists"])
        invalid_paths = len(path_check_results) - valid_paths
        
        st.write(f"Valid source paths: {valid_paths}")
        st.write(f"Invalid source paths: {invalid_paths}")
        
        # Display path check results
        st.subheader("Path Check Results")
        for result in path_check_results:
            if result["source_exists"]:
                st.markdown(f"<div class='path-check'>✅ {result['json_path']} -> {result['source_path']}</div>", unsafe_allow_html=True)
            else:
                st.markdown(f"<div class='path-error'>❌ {result['json_path']} -> {result['source_path']} (source not found)</div>", unsafe_allow_html=True)
    else:
        st.info("No JSON files found in the database directory")

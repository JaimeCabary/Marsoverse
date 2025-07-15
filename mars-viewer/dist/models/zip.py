import os
import zipfile

# Directory containing the zip files
source_dir = r"C:\Users\Admin\Desktop\Marsoverse\models"

# Loop through all files in the directory
for filename in os.listdir(source_dir):
    if filename.endswith(".zip"):
        zip_path = os.path.join(source_dir, filename)
        
        # Create a folder with the same name as the zip (without .zip)
        folder_name = os.path.splitext(filename)[0]
        extract_path = os.path.join(source_dir, folder_name)
        
        # Create the folder if it doesn't exist
        os.makedirs(extract_path, exist_ok=True)

        # Extract the zip into the folder
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        print(f"Extracted: {filename} → {folder_name}")

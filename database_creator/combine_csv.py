import os
import sqlite3
import pandas as pd

# Folder containing all CSV files
csv_folder = './us_car_models_data_master'
output_db = './cars.db'  # Output SQLite database file

# List to collect all car data
all_cars_data = []

# Process CSV files for each year
for year in range(1992, 2027):
    file_path = os.path.join(csv_folder, f'{year}.csv')
    if os.path.exists(file_path):
        # Read the current year's CSV
        df = pd.read_csv(file_path)
        df['year'] = year  # Ensure year is included in case it's missing
        all_cars_data.append(df)
    else:
        print(f"File {year}.csv not found, skipping.")

# Combine all years' data into one DataFrame
if all_cars_data:
    all_cars = pd.concat(all_cars_data, ignore_index=True)
else:
    raise FileNotFoundError("No CSV files found for the specified range.")

# Connect to SQLite and create the all_cars table
conn = sqlite3.connect(output_db)
cursor = conn.cursor()

# Create the all_cars table
cursor.execute('''
CREATE TABLE IF NOT EXISTS all_cars (
    year INTEGER,
    make TEXT,
    model TEXT,
    body_styles TEXT
)
''')

# Insert the combined data into SQLite
all_cars.to_sql('all_cars', conn, if_exists='replace', index=False)

# Commit changes and close the connection
conn.commit()
conn.close()

print(f"All cars data merged and stored in {output_db} as 'all_cars'.")

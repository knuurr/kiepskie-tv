import csv
import json
from datetime import datetime
import re

def extract_names(text):
    # Split by common separators and clean up
    names = [name.strip() for name in re.split(r'[,;]', text)]
    # Remove empty strings
    return [name for name in names if name]

def extract_date_components(date_string):
    # Extract day, month, year from date format DD.MM.YYYY
    try:
        day, month, year = date_string.split('.')
        return {
            'day': int(day),
            'month': int(month),
            'year': int(year)
        }
    except:
        return {
            'day': None,
            'month': None,
            'year': None
        }

def extract_year(date_string):
    # Extract year from date format DD.MM.YYYY
    try:
        return date_string.split('.')[-1]
    except:
        return None

def convert_csv_to_json(csv_file_path, json_file_path):
    # Sets to store unique values
    unique_directors = set()
    unique_writers = set()
    unique_years = set()
    
    # First pass to collect unique values
    with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            directors = extract_names(row["Reżyseria"])
            unique_directors.update(directors)
            
            writers = extract_names(row["Scenariusz"])
            unique_writers.update(writers)
            
            year = extract_year(row["Data premiery"])
            if year:
                unique_years.add(year)

    # Second pass to create the final JSON
    with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        metadata = {
            "generated_at": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            "header_metadata": {
                "nr": "Odcinek",
                "tytul": "Tytuł",
                "opis_odcinka": "Opis odcinka",
                "data_premiery": "Data premiery",
                "rezyseria": "Reżyseria",
                "scenariusz": "Scenariusz",
                "sezon": "Sezon"
            },
            "cached_data": {
                "directors": sorted(list(unique_directors)),
                "writers": sorted(list(unique_writers)),
                "years": sorted(list(unique_years))
            }
        }

        data = []
        
        for row in csv_reader:
            date_components = extract_date_components(row["Data premiery"])
            
            data_row = {
                "nr": int(row["Nr"]),
                "tytul": row["Tytuł"],
                "opis_odcinka": row["Opis odcinka"],
                "data_premiery": row["Data premiery"],
                "data_components": date_components,
                "rezyseria": row["Reżyseria"],
                "scenariusz": row["Scenariusz"],
                "sezon": int(row["Sezon"]),
                "link_wiki": row["Link wiki"]
            }
            data.append(data_row)

        json_data = {
            "metadata": metadata,
            "data": data
        }
        
        with open(json_file_path, mode='w', encoding='utf-8') as json_file:
            json.dump(json_data, json_file, indent=2, ensure_ascii=False)

    print(f"CSV data has been successfully converted to {json_file_path}")

# Example usage
csv_file_path = "tools/Kiepscy_Tabela.csv"
json_file_path = "tools/Kiepscy_Tabela.json"

convert_csv_to_json(csv_file_path, json_file_path)

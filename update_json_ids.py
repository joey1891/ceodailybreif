import os
import json

def update_json_ids(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                category = data.get('category')
                if category == "리포트":
                    data['category'] = "/report"
                elif category == "경제 동향":
                     data['category'] = "/economic-trends"
                elif category == "금융 동향":
                     data['category'] = "/finance"
                elif category == "산업 동향":
                     data['category'] = "/industry"
                elif category == "기업 동향":
                     data['category'] = "/company"
                elif category == "정책 동향":
                     data['category'] = "/policy"
                elif category == "언론 동향":
                     data['category'] = "/media"
                elif category == "마케팅 동향":
                     data['category'] = "/marketing"
                elif category == "인물과 동향":
                     data['category'] = "/people"
                elif category == "미디어 리뷰":
                     data['category'] = "/media-review"

                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

                print(f"Updated category in {filename}")

            except Exception as e:
                print(f"Error processing {filename}: {e}")

# Specify the directory containing the JSON files
directory_path = 'supabase_data_json/posts'
update_json_ids(directory_path)

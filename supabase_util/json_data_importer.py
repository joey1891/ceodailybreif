import os
import json
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client
from typing import Dict, List, Any, Optional, Tuple
import time

# .env 파일에서 환경 변수 로드
load_dotenv()

class SupabaseExplorer:
    def __init__(self):
        # 환경 변수에서 Supabase 연결 정보 가져오기
        self.supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        # 서비스 롤 키 사용 (RLS 우회를 위함)
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env 파일에 없습니다.")

        print(f"Supabase {self.supabase_url}에 서비스 롤로 연결 중...")
        self.supabase = create_client(self.supabase_url, self.supabase_key)

        # 사용 가능한 테이블 목록
        self.available_tables = [
            "admin_users",
            "calendar_events",
            "comments",
            "page_contents",
            "page_sections",
            "posts",
            "related_links",
            "url_mappings"
        ]

    def get_database_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """데이터베이스 스키마를 조회합니다."""
        schema_info = {}

        for table_name in self.available_tables:
            try:
                query = f"""
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM
                    information_schema.columns
                WHERE
                    table_schema = 'public'
                    AND table_name = '{table_name}'
                ORDER BY
                    ordinal_position;
                """

                response = self.supabase.rpc('pgql', {'query': query}).execute()
                if hasattr(response, 'data'):
                    schema_info[table_name] = response.data
            except Exception as e:
                print(f"테이블 {table_name}의 스키마 정보 조회 실패: {e}")
                schema_info[table_name] = []

        return schema_info

    def get_table_counts(self) -> Dict[str, int]:
        """각 테이블의 행 수를 조회합니다."""
        counts = {}

        for table_name in self.available_tables:
            try:
                query = f"""
                SELECT count(*) as count
                FROM {table_name}
                """
                response = self.supabase.rpc('pgql', {'query': query}).execute()
                if hasattr(response, 'data') and len(response.data) > 0:
                    counts[table_name] = response.data[0]['count']
                else:
                    counts[table_name] = 0
            except Exception as e:
                print(f"테이블 {table_name}의 행 수 조회 실패: {e}")
                counts[table_name] = -1

        return counts

    def print_database_summary(self) -> None:
        """데이터베이스 요약 정보를 콘솔에 출력합니다."""
        schema_info = self.get_database_schema()
        counts = self.get_table_counts()

        print("\n===== 데이터베이스 요약 정보 =====")
        for table_name in self.available_tables:
            count = counts.get(table_name, -1)
            count_str = str(count) if count >= 0 else "조회 실패"
            print(f"\n테이블: {table_name} (행 수: {count_str})")
            
            columns = schema_info.get(table_name, [])
            if columns:
                print("  컬럼:")
                for col in columns:
                    nullable = "NULL 허용" if col.get('is_nullable') == 'YES' else "NOT NULL"
                    default = f"기본값: {col.get('column_default')}" if col.get('column_default') else "기본값 없음"
                    print(f"    - {col.get('column_name')}: {col.get('data_type')} ({nullable}, {default})")
            else:
                print("  스키마 정보를 가져올 수 없습니다.")

    def export_table_data_to_json(self, output_dir: str = "supabase_data_json") -> None:
        """모든 테이블의 데이터를 JSON 파일로 내보냅니다."""
        os.makedirs(output_dir, exist_ok=True)
        
        for table_name in self.available_tables:
            table_dir = os.path.join(output_dir, table_name)
            os.makedirs(table_dir, exist_ok=True)
            
            try:
                print(f"\n테이블 '{table_name}'의 데이터를 내보내는 중...")
                response = self.supabase.table(table_name).select('*').execute()
                
                if hasattr(response, 'data'):
                    data = response.data
                    if data:
                        # 데이터가 많은 경우 여러 파일로 나눔
                        max_records_per_file = 100
                        total_files = (len(data) + max_records_per_file - 1) // max_records_per_file
                        
                        for i in range(total_files):
                            start_idx = i * max_records_per_file
                            end_idx = min((i + 1) * max_records_per_file, len(data))
                            chunk_data = data[start_idx:end_idx]
                            
                            file_path = os.path.join(table_dir, f"{table_name}_{i+1}.json")
                            with open(file_path, 'w', encoding='utf-8') as f:
                                json.dump(chunk_data, f, ensure_ascii=False, indent=2)
                            
                            print(f"  파일 저장: {file_path} ({len(chunk_data)}개 레코드)")
                        
                        print(f"  '{table_name}' 테이블 데이터 내보내기 완료 (총 {len(data)}개 레코드)")
                    else:
                        print(f"  '{table_name}' 테이블에 데이터가 없습니다.")
                else:
                    print(f"  '{table_name}' 테이블 데이터를 가져올 수 없습니다.")
            except Exception as e:
                print(f"  오류: {table_name} 테이블 데이터 내보내기 실패 - {e}")

    def export_table_to_csv(self, table_name: str, output_dir: str = "supabase_data_csv") -> None:
        """특정 테이블의 데이터를 CSV 파일로 내보냅니다."""
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            print(f"\n테이블 '{table_name}'의 데이터를 CSV로 내보내는 중...")
            response = self.supabase.table(table_name).select('*').execute()
            
            if hasattr(response, 'data'):
                data = response.data
                if data:
                    df = pd.DataFrame(data)
                    file_path = os.path.join(output_dir, f"{table_name}.csv")
                    df.to_csv(file_path, index=False)
                    print(f"  파일 저장: {file_path} ({len(data)}개 레코드)")
                else:
                    print(f"  '{table_name}' 테이블에 데이터가 없습니다.")
            else:
                print(f"  '{table_name}' 테이블 데이터를 가져올 수 없습니다.")
        except Exception as e:
            print(f"  오류: {table_name} 테이블 데이터 CSV 내보내기 실패 - {e}")

    def export_all_tables_to_csv(self, output_dir: str = "supabase_data_csv") -> None:
        """모든 테이블의 데이터를 CSV 파일로 내보냅니다."""
        for table_name in self.available_tables:
            self.export_table_to_csv(table_name, output_dir)

    def get_table_preview(self, table_name: str, limit: int = 5) -> Tuple[List[Dict[str, Any]], List[str]]:
        """테이블의 데이터 미리보기와 컬럼 이름을 반환합니다."""
        try:
            response = self.supabase.table(table_name).select('*').limit(limit).execute()
            
            if hasattr(response, 'data') and response.data:
                columns = list(response.data[0].keys())
                return response.data, columns
            else:
                return [], []
        except Exception as e:
            print(f"테이블 {table_name}의 데이터 미리보기 조회 실패: {e}")
            return [], []

    def preview_specific_table(self, table_name: str) -> None:
        """특정 테이블의 정보와 데이터를 상세히 보여줍니다."""
        if table_name not in self.available_tables:
            print(f"테이블 '{table_name}'은(는) 사용 가능한 테이블이 아닙니다.")
            return
        
        try:
            # 테이블 스키마 정보 조회
            schema_info = self.get_database_schema().get(table_name, [])
            
            # 테이블 행 수 조회
            counts = self.get_table_counts()
            count = counts.get(table_name, -1)
            
            # 데이터 미리보기
            preview_data, columns = self.get_table_preview(table_name)
            
            print(f"\n===== 테이블: {table_name} =====")
            print(f"행 수: {count if count >= 0 else '조회 실패'}")
            
            # 스키마 출력
            if schema_info:
                print("\n스키마 정보:")
                for col in schema_info:
                    nullable = "NULL 허용" if col.get('is_nullable') == 'YES' else "NOT NULL"
                    default = f"기본값: {col.get('column_default')}" if col.get('column_default') else "기본값 없음"
                    print(f"  - {col.get('column_name')}: {col.get('data_type')} ({nullable}, {default})")
            else:
                print("\n스키마 정보를 가져올 수 없습니다.")
            
            # 데이터 미리보기 출력
            if preview_data:
                print("\n데이터 미리보기:")
                for i, row in enumerate(preview_data, 1):
                    print(f"\n--- 행 {i} ---")
                    for col, value in row.items():
                        print(f"  {col}: {value}")
            else:
                print("\n데이터 미리보기를 가져올 수 없습니다.")
                
        except Exception as e:
            print(f"테이블 {table_name} 정보 조회 실패: {e}")

    def get_all_posts_data(self) -> List[Dict[str, Any]]:
        """posts 테이블의 모든 데이터를 가져옵니다."""
        try:
            print("posts 테이블의 모든 데이터를 가져오는 중...")
            response = self.supabase.table("posts").select('*').execute()
            
            if hasattr(response, 'data'):
                print(f"총 {len(response.data)}개의 posts 데이터를 가져왔습니다.")
                return response.data
            else:
                print("posts 테이블에서 데이터를 가져올 수 없습니다.")
                return []
        except Exception as e:
            print(f"posts 테이블에서 데이터를 가져오는 중 오류 발생: {e}")
            return []
    
    def export_all_posts_to_csv(self, filepath: str = "posts_all_data.csv") -> None:
        """posts 테이블의 모든 데이터를 CSV 파일로 내보냅니다."""
        try:
            data = self.get_all_posts_data()
            if data:
                df = pd.DataFrame(data)
                df.to_csv(filepath, index=False)
                print(f"posts 테이블의 모든 데이터가 {filepath}에 저장되었습니다.")
            else:
                print("내보낼 posts 데이터가 없습니다.")
        except Exception as e:
            print(f"posts 데이터 내보내기 중 오류 발생: {e}")


def main():
    try:
        explorer = SupabaseExplorer()
        
        print("\n===== SUPABASE 포스트 데이터 추출기 =====")
        print("posts 테이블의 모든 데이터를 가져옵니다.")
        
        posts_data = explorer.get_all_posts_data()
        
        if posts_data:
            print(f"\n총 {len(posts_data)}개의 포스트를 가져왔습니다.")
            
            # 모든 포스트 정보 출력
            print("\n포스트 목록 전체:")
            for i, post in enumerate(posts_data, 1):
                title = post.get('title', 'No title')
                post_id = post.get('id', 'No ID')
                print(f"  {i}. ID: {post_id} - {title}")
        else:
            print("posts 테이블에 데이터가 없습니다.")
            
    except Exception as e:
        print(f"오류: {e}")
        print("\n문제 해결 팁:")
        print("1. .env 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 있는지 확인하세요.")
        print("2. Supabase URL과 키가 올바른지 확인하세요.")
        print("3. 필요한 Python 패키지가 설치되어 있는지 확인하세요:")
        print("   pip install python-dotenv supabase pandas")


if __name__ == "__main__":
    main()
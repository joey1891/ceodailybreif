"use client";

// Add this before importing ReactQuill
// This suppresses console warnings only in production
if (process.env.NODE_ENV === 'production') {
  // Save the original console.warn
  const originalWarn = console.warn;
  // Override console.warn to filter out the specific warning
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('DOMNodeInserted')) {
      return;
    }
    originalWarn(...args);
  };
}

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { common, createLowlight } from 'lowlight';
import { supabase } from "@/lib/supabase";
import { Node, Mark, mergeAttributes, Extension } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
// import CKEditorCloud from "./CKEditorCloud";

// lowlight 인스턴스 생성
const lowlight = createLowlight(common);

// Quill 관련 임포트 모두 제거

// --- CustomFontSize Extension ---
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customFontSize: {
      setCustomFontSize: (fontSize: string) => ReturnType;
      unsetCustomFontSize: () => ReturnType;
    };
  }
}

const CustomFontSize = Extension.create({
  name: 'customFontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setCustomFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetCustomFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run();
      },
    };
  },
});
// --- End CustomFontSize Extension ---

// 상수 및 타입 정의
interface Props {
  value: string;
  onChangeAction: (value: string) => void;
  onImageUpload?: (imageUrl: string) => void;
  style?: React.CSSProperties;
}

// 표에 인라인 스타일을 적용하는 확장 생성
const TableWithStyle = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return ['table', { 
      ...HTMLAttributes, 
      style: 'border-collapse: collapse; width: 100%; margin: 8px 0; border: 1px solid #ced4da;' 
    }, ['tbody', {}, 0]];
  }
});

const TableCellWithStyle = TableCell.extend({
  renderHTML({ HTMLAttributes }) {
    return ['td', { 
      ...HTMLAttributes, 
      style: 'border: 1px solid #ced4da; padding: 8px; min-width: 1em;' 
    }, 0];
  }
});

const TableHeaderWithStyle = TableHeader.extend({
  renderHTML({ HTMLAttributes }) {
    return ['th', { 
      ...HTMLAttributes, 
      style: 'border: 1px solid #ced4da; padding: 8px; background-color: #f8f9fa; font-weight: bold; text-align: left;' 
    }, 0];
  }
});

// Add this CSS to your component or in a global CSS file
const tableStyles = `
  .ProseMirror table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;
  }
  
  .ProseMirror td,
  .ProseMirror th {
    border: 2px solid #ced4da;
    box-sizing: border-box;
    min-width: 1em;
    padding: 3px 5px;
    position: relative;
    vertical-align: top;
  }
  
  .ProseMirror th {
    background-color: #f1f3f5;
    font-weight: bold;
    text-align: left;
  }
  
  .ProseMirror .selectedCell:after {
    background: rgba(200, 200, 255, 0.4);
    content: "";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    position: absolute;
    z-index: 2;
  }
  
  .ProseMirror .column-resize-handle {
    background-color: #adf;
    bottom: -2px;
    position: absolute;
    right: -2px;
    pointer-events: none;
    top: 0;
    width: 4px;
    cursor: col-resize !important;
  }
  
  .ProseMirror .row-resize-handle {
    background-color: #adf;
    height: 4px;
    left: 0;
    right: 0;
    bottom: -2px;
    position: absolute;
    pointer-events: none;
    cursor: row-resize !important;
  }
  
  .tableWrapper {
    overflow-x: auto;
  }
  
  .resize-cursor {
    cursor: col-resize !important;
  }
  
  .row-resize-cursor {
    cursor: row-resize !important;
  }
`;

// sanitizeHtml 함수 수정
const sanitizeHtml = (html: string) => {
  // 빈 내용이면 빈 문자열 반환
  if (!html || html === '<p></p>') return '';
  
  // div.editor-content 제거: 이 클래스를 추가하지 않고 직접 HTML 반환
  return html;
};

// 에디터 공통 스타일에 !important 추가하여 우선순위 높임
export const editorGlobalStyles = `
  /* 기본 단락 스타일 */
  p {
    margin: 0.75em 0 !important;
  }
  
  /* 빈 단락 (줄바꿈) 유지 */
  p:empty {
    min-height: 1em !important;
    margin: 0.75em 0 !important;
    display: block !important;
  }
  
  /* 목록 스타일 */
  ul {
    list-style-type: disc !important;
    padding-left: 2em !important;
    margin: 1em 0 !important;
  }
  
  ol {
    list-style-type: decimal !important;
    padding-left: 2em !important;
    margin: 1em 0 !important;
  }
  
  /* 중첩 목록 스타일 */
  ul ul,
  ol ol,
  ul ol,
  ol ul {
    margin: 0.25em 0 0.5em 0 !important;
  }
  
  /* 목록 항목 스타일 */
  li p {
    margin: 0.25em 0 !important;
  }
  
  /* 이미지 스타일 */
  img {
    max-width: 100% !important;
    height: auto !important;
    margin: 1em auto !important;
  }
  
  /* 체크리스트 스타일 */
  ul[data-type="taskList"] {
    list-style-type: none !important;
    padding-left: 0.5em !important;
  }
  
  li[data-type="taskItem"] {
    display: flex !important;
    align-items: flex-start !important;
    margin-bottom: 0.5em !important;
  }
  
  li[data-type="taskItem"] > label {
    display: flex !important;
    align-items: center !important;
  }
  
  li[data-type="taskItem"] > label > input {
    margin-right: 0.5em !important;
  }
  
  /* 기타 스타일 */
  blockquote {
    border-left: 3px solid #ddd !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 1em !important;
    color: #666 !important;
  }
  
  strong {
    font-weight: bold !important;
  }
`;

// Bullet 목록 확장 설정 수정
const BulletListWithSpacing = BulletList.extend({
  parseHTML() {
    return [
      {
        tag: 'ul'
      }
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['ul', { ...HTMLAttributes, class: 'spaced-list' }, 0]
  }
});

// 목록 항목 확장 설정 수정
const ListItemWithSpacing = ListItem.extend({
  parseHTML() {
    return [
      {
        tag: 'li'
      }
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['li', { ...HTMLAttributes, class: 'spaced-list-item' }, 0]
  }
});

export default function EditorWithUploader({ 
  value, 
  onChangeAction, 
  onImageUpload,
  style 
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editorData, setEditorData] = useState(value);

  // 이미지 업로드 핸들러 (기존 함수 재사용)
  const handleUpload = async (file: File) => {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.]/g, '')}`;
      const filePath = `articles/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      // 이 부분은 handlePaste 내에서 호출될 때 editor가 사용 가능해야 합니다.
      // editor?.chain().focus().setImage({ src: urlData.publicUrl }).run(); 
      
      if (onImageUpload) {
        onImageUpload(urlData.publicUrl);
      }
      
      return urlData.publicUrl;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      return '';
    }
  };

  // 에디터 설정
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image,
      TableWithStyle.configure({
        resizable: true,
        lastColumnResizable: true,
        cellMinWidth: 50,
      }),
      TableRow,
      TableCellWithStyle,
      TableHeaderWithStyle,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Subscript,
      Superscript,
      CustomFontSize,
      BulletListWithSpacing.configure({
        keepMarks: true,
        keepAttributes: true,
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: true,
      }),
      ListItemWithSpacing.configure({
        HTMLAttributes: {
          class: 'list-item-with-spacing',
        }
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      try {
        // HTML 가져오기 (정제 작업 최소화)
        const html = editor.getHTML();
        const sanitizedHtml = sanitizeHtml(html);
        
        // editor-content 클래스를 추가하지 않고 HTML만 전달
        setEditorData(sanitizedHtml);
        onChangeAction(sanitizedHtml);
      } catch (error) {
        console.error("에디터 업데이트 오류:", error);
        const text = editor.getText();
        setEditorData(`<p>${text}</p>`);
        onChangeAction(`<p>${text}</p>`);
      }
    },
    editable: true,
    autofocus: 'end',
    editorProps: {
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        let imagePasted = false;

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            event.preventDefault(); // 기본 붙여넣기 동작 방지
            const file = item.getAsFile();
            if (file) {
              imagePasted = true;
              handleUpload(file).then(imageUrl => {
                if (imageUrl && editor) {
                  editor.chain().focus().setImage({ src: imageUrl }).run();
                }
              }).catch(error => {
                console.error("붙여넣은 이미지 업로드 실패:", error);
                // 오류 처리 (예: 사용자에게 알림)
              });
            }
          }
        }
        // 이미지가 성공적으로 처리되었으면 true를 반환하여 Tiptap의 기본 paste 핸들러를 중지합니다.
        // 그렇지 않으면 false를 반환하여 다른 콘텐츠(텍스트 등)가 정상적으로 붙여넣어지도록 합니다.
        return imagePasted; 
      },
    },
  });

  // 이미지 업로드 핸들러 (파일 입력용)
  const handleFileUpload = async (file: File) => {
    const imageUrl = await handleUpload(file);
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
  };

  // 링크 추가 핸들러
  const addLink = () => {
    if (linkUrl) {
      // 현재 커서 위치를 가져옵니다.
      const currentPos = editor?.state.selection.anchor || 0;

      editor?.chain().focus()
        // "링크" 텍스트를 삽입합니다.
        .insertContent('링크')
        // 삽입된 "링크" 텍스트를 선택합니다.
        // insertContent는 텍스트 삽입 후 커서를 삽입된 텍스트 끝으로 이동시킵니다.
        // 따라서 삽입된 텍스트의 시작 위치는 현재 커서 위치와 같습니다.
        .setTextSelection({ from: currentPos, to: currentPos + '링크'.length })
        // 선택된 "링크" 텍스트에 링크를 적용합니다.
        .setLink({ href: linkUrl })
        // 링크 뒤에 커서를 위치시킵니다.
        .setTextSelection(currentPos + '링크'.length)
        .run();
        
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };
  
  // 툴바 스타일 공통화
  const buttonStyle = (isActive: boolean) => ({
    marginRight: '5px', 
    padding: '5px 10px', 
    backgroundColor: isActive ? '#e9ecef' : '#fff', 
    border: '1px solid #ced4da', 
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  });

  // 툴바 버튼 렌더링
  const renderToolbar = () => {
    if (!editor) return null;
    
    const FONT_SIZES = ['Default', '8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'];
    const currentFontSize = editor.getAttributes('textStyle').fontSize || 'Default';

    return (
      <div className="editor-toolbar" style={{ 
        marginBottom: '10px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        border: '1px solid #ced4da'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '8px' }}>
          {/* 서식 관련 버튼 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            style={buttonStyle(editor.isActive('bold'))}
            title="굵게"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            style={buttonStyle(editor.isActive('italic'))}
            title="기울임"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            style={buttonStyle(editor.isActive('underline'))}
            title="밑줄"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            style={buttonStyle(editor.isActive('strike'))}
            title="취소선"
          >
            <s>S</s>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            style={buttonStyle(editor.isActive('subscript'))}
            title="아래 첨자"
          >
            x₂
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            style={buttonStyle(editor.isActive('superscript'))}
            title="위 첨자"
          >
            x²
          </button>
          
          {/* 구분선 */}
          <div style={{ width: '1px', backgroundColor: '#ced4da', margin: '0 10px' }}></div>
          
          {/* 글꼴 크기 선택 */}
          <select
            value={FONT_SIZES.includes(currentFontSize) ? currentFontSize : 'Default'}
            onChange={(e) => {
              const newSize = e.target.value;
              if (newSize === 'Default') {
                editor.chain().focus().unsetCustomFontSize().run();
              } else {
                editor.chain().focus().setCustomFontSize(newSize).run();
              }
            }}
            style={{
              marginRight: '5px',
              padding: '5px 10px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              backgroundColor: '#fff',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="글꼴 크기"
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>
                {size === 'Default' ? '기본 크기' : size}
              </option>
            ))}
          </select>
          
          {/* 제목 버튼 */}
          <select 
            onChange={(e) => {
              const level = parseInt(e.target.value);
              if (level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
              }
            }}
            style={{ 
              marginRight: '5px', 
              padding: '5px 10px', 
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              backgroundColor: '#fff' 
            }}
          >
            <option value="0">텍스트</option>
            <option value="1">제목 1</option>
            <option value="2">제목 2</option>
            <option value="3">제목 3</option>
            <option value="4">제목 4</option>
            <option value="5">제목 5</option>
            <option value="6">제목 6</option>
          </select>
          
          {/* 텍스트 정렬 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            style={buttonStyle(editor.isActive({ textAlign: 'left' }))}
            title="왼쪽 정렬"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            style={buttonStyle(editor.isActive({ textAlign: 'center' }))}
            title="가운데 정렬"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            style={buttonStyle(editor.isActive({ textAlign: 'right' }))}
            title="오른쪽 정렬"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            style={buttonStyle(editor.isActive({ textAlign: 'justify' }))}
            title="양쪽 정렬"
          >
            ⇋
          </button>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* 목록 관련 버튼 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            style={buttonStyle(editor.isActive('bulletList'))}
            title="글머리 기호"
          >
            • 목록
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            style={buttonStyle(editor.isActive('orderedList'))}
            title="번호 매기기"
          >
            1. 번호
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            style={buttonStyle(editor.isActive('taskList'))}
            title="체크리스트"
          >
            ☑ 체크
          </button>
          
          {/* 구분선 */}
          <div style={{ width: '1px', backgroundColor: '#ced4da', margin: '0 10px' }}></div>
          
          {/* 기타 서식 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            style={buttonStyle(editor.isActive('blockquote'))}
            title="인용구"
          >
            인용
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            style={buttonStyle(editor.isActive('codeBlock'))}
            title="코드 블록"
          >
            코드
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            style={buttonStyle(false)}
            title="가로선"
          >
            가로선
          </button>
          
          {/* 구분선 */}
          <div style={{ width: '1px', backgroundColor: '#ced4da', margin: '0 10px' }}></div>
          
          {/* 링크 */}
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            style={buttonStyle(editor.isActive('link'))}
            title="링크"
          >
            링크
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              style={buttonStyle(false)}
              title="링크 제거"
            >
              링크제거
            </button>
          )}
          
          {/* 색상 선택 */}
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            title="글자 색상"
            style={{ 
              marginRight: '5px',
              width: '30px',
              height: '30px',
              padding: '0',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
          
          {/* 구분선 */}
          <div style={{ width: '1px', backgroundColor: '#ced4da', margin: '0 10px' }}></div>
          
          {/* 테이블 버튼 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            style={buttonStyle(false)}
            title="테이블 삽입"
          >
            테이블
          </button>
          
          {/* 이미지 업로드 버튼 */}
          <input
            type="file"
            id="image-upload"
            style={{ display: 'none' }}
            accept="image/*" 
            onChange={(e) => {
              if (e.target.files?.length) {
                // handleUpload(e.target.files[0]); // 이 부분을 handleFileUpload로 변경
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <button
            type="button"
            onClick={() => document.getElementById('image-upload')?.click()}
            style={buttonStyle(false)}
            title="이미지 삽입"
          >
            이미지
          </button>
          
          {/* 실행 취소/다시 실행 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            style={buttonStyle(false)}
            title="실행 취소"
            disabled={!editor.can().undo()}
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            style={buttonStyle(false)}
            title="다시 실행"
            disabled={!editor.can().redo()}
          >
            ↪
          </button>
        </div>
        
        {/* 링크 모달 */}
        {showLinkModal && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            border: '1px solid #ced4da', 
            borderRadius: '4px',
            backgroundColor: '#fff'
          }}>
            <input 
              type="text" 
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL 입력"
              style={{ 
                width: '70%', 
                padding: '5px', 
                marginRight: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
            <button 
              type="button" 
              onClick={addLink}
              style={{
                padding: '5px 10px',
                backgroundColor: '#4dabf7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginRight: '5px'
              }}
            >
              확인
            </button>
            <button 
              type="button" 
              onClick={() => setShowLinkModal(false)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#f1f3f5',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            >
              취소
            </button>
          </div>
        )}
      </div>
    );
  };

  // 에디터 초기화 확인
  useEffect(() => {
    if (editor) {
      // 에디터가 초기화되면 내용 설정
      if (value && editor.isEmpty) {
        editor.commands.setContent(value);
      }
      
      // 디버깅을 위한 이벤트 리스너
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (editor.isEmpty) return;
        
        // 작성 중인 내용이 있으면 경고
        e.preventDefault();
        e.returnValue = '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [editor, value]);

  useEffect(() => {
    // CSS 동적 삽입 (에디터 스타일)
    const style = document.createElement('style');
    style.innerHTML = `
      ${editorGlobalStyles}
      .ProseMirror {
        outline: none;
        background-color: #fff;
        color: #333;
        font-family: 'Times New Roman', Times, serif;
        font-size: 16px;
        line-height: 1.5;
      }
      .ProseMirror:focus {
        outline: none;
      }
      .ProseMirror p {
        margin: 0.5em 0;
      }
      .ProseMirror h1 {
        font-size: 2em;
        margin: 0.67em 0;
      }
      .ProseMirror h2 {
        font-size: 1.5em;
        margin: 0.83em 0;
      }
      .ProseMirror h3 {
        font-size: 1.17em;
        margin: 1em 0;
      }
      .ProseMirror h4 {
        font-size: 1em;
        margin: 1.33em 0;
      }
      .ProseMirror h5 {
        font-size: 0.83em;
        margin: 1.67em 0;
      }
      .ProseMirror h6 {
        font-size: 0.67em;
        margin: 2.33em 0;
      }
      .ProseMirror ul, .ProseMirror ol {
        padding-left: 2em;
      }
      .ProseMirror ul {
        list-style-type: disc;
      }
      .ProseMirror ol {
        list-style-type: decimal;
      }
      .ProseMirror blockquote {
        border-left: 3px solid #ddd;
        margin-left: 0;
        margin-right: 0;
        padding-left: 1em;
        color: #666;
      }
      .ProseMirror pre {
        background-color: #f8f9fa;
        border-radius: 4px;
        font-family: Consolas, Monaco, 'Andale Mono', monospace;
        padding: 0.75em 1em;
        white-space: pre-wrap;
      }
      .ProseMirror code {
        background-color: rgba(97, 97, 97, 0.1);
        border-radius: 2px;
        font-size: 0.9em;
        padding: 0.25em;
        font-family: Consolas, Monaco, 'Andale Mono', monospace;
      }
      .ProseMirror a {
        color: #007bff;
        text-decoration: underline;
      }
      .ProseMirror hr {
        border: none;
        border-top: 1px solid #ced4da;
        margin: 1em 0;
      }
      .ProseMirror table {
        border-collapse: collapse;
        margin: 0;
        overflow: hidden;
        table-layout: fixed;
        width: 100%;
        margin: 0.5em 0;
      }
      .ProseMirror table td,
      .ProseMirror table th {
        border: 1px solid #ced4da;
        box-sizing: border-box;
        min-width: 1em;
        padding: 8px;
        position: relative;
        vertical-align: top;
      }
      .ProseMirror table th {
        background-color: #f8f9fa;
        font-weight: bold;
        text-align: left;
      }
      .ProseMirror table .selectedCell:after {
        background: rgba(200, 200, 255, 0.4);
        content: "";
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        pointer-events: none;
        position: absolute;
        z-index: 2;
      }
      .ProseMirror img {
        max-width: 100%;
        height: auto;
        margin: 0.5em 0;
      }
      .ProseMirror .task-list {
        list-style-type: none;
        padding-left: 0.5em;
      }
      .ProseMirror .task-list-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.5em;
      }
      .ProseMirror .task-list-item-checkbox {
        margin-right: 0.5em;
        margin-top: 0.2em;
      }
    `;
    document.head.appendChild(style);
    
    // 글로벌 스타일도 추가
    const globalStyle = document.createElement('style');
    globalStyle.innerHTML = editorGlobalStyles;
    document.head.appendChild(globalStyle);
    
    setIsMounted(true);
    
    return () => {
      document.head.removeChild(style);
      document.head.removeChild(globalStyle);
      editor?.destroy();
    };
  }, []);

  useEffect(() => {
    if (editor && !editor.isEditable) {
      editor.setEditable(true);
    }
  }, [editor]);

  if (!isMounted) {
    return <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa", borderRadius: "4px", border: '1px solid #ced4da' }}>
      에디터 로딩 중...
    </div>;
  }

  return (
    <>
      <style jsx global>{tableStyles}</style>
      <div style={{ ...style, height: "auto", minHeight: "400px", padding: '10px' }}>
        {renderToolbar()}
        <div 
          onClick={() => editor?.chain().focus().run()}
          style={{ position: 'relative', height: '300px' }}
        >
          <EditorContent 
            editor={editor}
            style={{ 
              height: "100%", 
              overflow: 'auto',
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              padding: '10px',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              cursor: 'text',
              backgroundColor: '#ffffff'
            }}
          />
        </div>
      </div>
    </>
  );
}

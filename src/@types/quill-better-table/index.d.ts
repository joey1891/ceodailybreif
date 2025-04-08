declare module 'quill-better-table' {
  import Quill from 'quill';
  
  export default class QuillBetterTable {
    static keyboardBindings: any;
    constructor(quill: any, options: any);
    insertTable(rows: number, columns: number): void;
  }
} 
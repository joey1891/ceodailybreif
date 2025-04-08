"use client";
import React, { forwardRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import "quill-better-table";

// Forward ref wrapper
const QuillWrapper = forwardRef((props: any, ref: any) => {
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && Quill) {
      const BetterTable = require('quill-better-table').default;
      Quill.register('modules/better-table', BetterTable);
    }
  }, [isMounted]);

  return <ReactQuill ref={ref} {...props} />;
});

QuillWrapper.displayName = 'QuillWrapper';

export default QuillWrapper;

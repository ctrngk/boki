function loadCK5() {
    console.log("loadCK5 called")

    const config = {

        toolbar: {
            items: [
                'undo',
                'redo',
                'heading',
                '|',
                'fontColor',
                'fontBackgroundColor',
                'fontSize',
                'fontFamily',
                '|',
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'highlight',
                'horizontalLine',
                '|',
                'alignment',
                '|',
                'numberedList',
                'bulletedList',
                '|',
                'indent',
                'outdent',
                '|',
                'todoList',
                'link',
                'blockQuote',
                'imageUpload',
                'insertTable',
                'mediaEmbed',
                '|',
                'codeBlock',
                'exportPdf',
                'exportWord',
                'htmlEmbed',
                'imageInsert',
                'MathType',
                'ChemType',
                'removeFormat',
                'specialCharacters',
                'superscript',
                'subscript',
                'code'
            ]
        },
        language: 'en',
        image: {
            toolbar: [
                'imageTextAlternative',
                'imageStyle:full',
                'imageStyle:side',
                'linkImage'
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells',
                'tableCellProperties',
                'tableProperties'
            ]
        },
        licenseKey: '',

    }
    DecoupledDocumentEditor
        .create(document.querySelector('.editor1'), config)
        .then(editor => {
            window.editor1 = editor;
            // Set a custom container for the toolbar.
            document.querySelector('.document-editor1__toolbar').appendChild(editor.ui.view.toolbar.element);
            // document.querySelector( '.ck-toolbar' ).classList.add( 'ck-reset_all' );
        })
        .catch(error => {
            console.error('Oops, something went wrong!');
            console.error('Please, report the following error on https://github.com/ckeditor/ckeditor5/issues with the build id and the error stack trace:');
            console.error(error);
        });
    DecoupledDocumentEditor
        .create(document.querySelector('.editor2'), config)
        .then(editor => {
            window.editor2 = editor;
            // Set a custom container for the toolbar.
            document.querySelector('.document-editor2__toolbar').appendChild(editor.ui.view.toolbar.element);
            // document.querySelector( '.ck-toolbar' ).classList.add( 'ck-reset_all' );
        })
        .catch(error => {
            console.error('Oops, something went wrong!');
            console.error('Please, report the following error on https://github.com/ckeditor/ckeditor5/issues with the build id and the error stack trace:');
            console.warn('Build id: 9wf91go947vr-73ba0kti0w5z');
            console.error(error);
        });
    DecoupledDocumentEditor
        .create(document.querySelector('.editor3'), config)
        .then(editor => {
            window.editor3 = editor;
            // Set a custom container for the toolbar.
            document.querySelector('.document-editor3__toolbar').appendChild(editor.ui.view.toolbar.element);
        })
        .catch(error => {
            console.error('Oops, something went wrong!');
            console.error('Please, report the following error on https://github.com/ckeditor/ckeditor5/issues with the build id and the error stack trace:');
            console.warn('Build id: 9wf91go947vr-73ba0kti0w5z');
            console.error(error);
        });
    return
}



'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Link as LinkIcon,
  Link2Off,
  Undo,
  Redo,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className={`h-8 w-8 shrink-0 ${active ? 'bg-accent text-accent-foreground' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              onClick()
            }}
            disabled={disabled}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your policy content here...\n\nYou can paste text from Word, Google Docs, or any web page and the formatting will be preserved.',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose-editor outline-none min-h-[280px] px-5 py-4',
      },
    },
  })

  // Sync external content changes (e.g. when editing an existing policy)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content || '', { emitUpdate: false })
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className='flex flex-col border rounded-lg overflow-hidden bg-background h-full'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/40 sticky top-0 z-10'>
        {/* History */}
        <ToolbarButton
          title='Undo'
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Redo'
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className='h-3.5 w-3.5' />
        </ToolbarButton>

        <Separator orientation='vertical' className='h-5 mx-1' />

        {/* Headings */}
        <ToolbarButton
          title='Heading 1'
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Heading 2'
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Heading 3'
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className='h-3.5 w-3.5' />
        </ToolbarButton>

        <Separator orientation='vertical' className='h-5 mx-1' />

        {/* Text formatting */}
        <ToolbarButton
          title='Bold (Ctrl+B)'
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Italic (Ctrl+I)'
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Underline (Ctrl+U)'
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Strikethrough'
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className='h-3.5 w-3.5' />
        </ToolbarButton>

        <Separator orientation='vertical' className='h-5 mx-1' />

        {/* Lists */}
        <ToolbarButton
          title='Bullet List'
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Numbered List'
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Blockquote'
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Divider'
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className='h-3.5 w-3.5' />
        </ToolbarButton>

        <Separator orientation='vertical' className='h-5 mx-1' />

        {/* Alignment */}
        <ToolbarButton
          title='Align Left'
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Align Center'
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Align Right'
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Justify'
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className='h-3.5 w-3.5' />
        </ToolbarButton>

        <Separator orientation='vertical' className='h-5 mx-1' />

        {/* Link */}
        <ToolbarButton
          title='Insert / Edit Link'
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <LinkIcon className='h-3.5 w-3.5' />
        </ToolbarButton>
        <ToolbarButton
          title='Remove Link'
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
        >
          <Link2Off className='h-3.5 w-3.5' />
        </ToolbarButton>
      </div>

      {/* Editor Body */}
      <div className='flex-1 overflow-y-auto'>
        <EditorContent editor={editor} className='h-full' />
      </div>
    </div>
  )
}

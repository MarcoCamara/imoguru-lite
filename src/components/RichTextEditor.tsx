import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Undo, Redo, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Table as TableIcon, Columns, Image as ImageIcon, 
  QrCode, Minus, Type
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onInsertPlaceholder?: (placeholder: string) => void; // Novo prop
}

export default function RichTextEditor({ content, onChange, onInsertPlaceholder }: RichTextEditorProps) {
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('Arial');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addTwoColumns = () => {
    editor.chain().focus().insertTable({ rows: 1, cols: 2, withHeaderRow: false }).run();
  };

  const insertQRCode = () => {
    editor.chain().focus().insertContent('<div style="text-align: center; padding: 20px;">{{qrcode}}</div>').run();
  };

  const insertImage = () => {
    const url = prompt('URL da imagem:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  const setFontFamilyEditor = (font: string) => {
    setFontFamily(font);
    editor.chain().focus().setFontFamily(font).run();
  };

  const setFontSizeEditor = (size: string) => {
    setFontSize(size);
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
  };

  const insertPlaceholder = (placeholder: string) => {
    editor.chain().focus().insertContent(`{{${placeholder}}}`).run();
  };

  // Se a função onInsertPlaceholder for fornecida, ela deve ser usada para expor a função interna
  // Porém, a integração via `ref` ou `useEffect` com `onInsertPlaceholder` seria mais robusta.
  // Para o propósito atual, vamos expor a função diretamente se o prop for definido.
  // Isso não é o ideal para um RichTextEditor genérico, mas atende à necessidade específica.
  if (onInsertPlaceholder) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      onInsertPlaceholder(field => editor.chain().focus().insertContent(field).run());
    }, [editor]); // Depende do objeto editor
  }

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col"> {/* Layout vertical: toolbar no topo */}
      {/* Toolbar Horizontal */}
      <div className="bg-muted p-2 flex flex-wrap gap-1 border-b items-center">
        {/* Seletor de Fonte */}
        <Select value={fontFamily} onValueChange={setFontFamilyEditor}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Courier New">Courier New</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
            <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
            <SelectItem value="Impact">Impact</SelectItem>
          </SelectContent>
        </Select>

        {/* Seletor de Tamanho */}
        <Select value={fontSize} onValueChange={setFontSizeEditor}>
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
              <SelectItem key={size} value={String(size)}>{size}px</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-8" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-accent' : ''}
          type="button"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-accent' : ''}
          type="button"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}
          type="button"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
          type="button"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant="ghost"
          size="icon"
          onClick={addTable}
          title="Inserir tabela 3x3"
          type="button"
        >
          <TableIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={addTwoColumns}
          title="Inserir 2 colunas"
          type="button"
        >
          <Columns className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={insertQRCode}
          title="Inserir QR Code"
          type="button"
        >
          <QrCode className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={insertImage}
          title="Inserir Imagem"
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={insertHorizontalRule}
          title="Inserir Linha Horizontal"
          type="button"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          type="button"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          type="button"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
        />
      </div>

      {/* Dynamic Fields Below Editor */}
      <div className="border-t bg-muted/50 p-3">
        <h4 className="font-semibold text-xs mb-2 text-muted-foreground">Campos Dinâmicos - Clique para inserir</h4>
        <div className="space-y-2">
          {/* Imóvel */}
          <div>
            <p className="font-medium text-xs text-muted-foreground mb-1">Imóvel</p>
            <div className="flex flex-wrap gap-1">
              {['title', 'code', 'property_type', 'city', 'neighborhood', 'sale_price', 'rental_price', 'bedrooms', 'bathrooms', 'parking_spaces', 'total_area', 'street', 'description', 'price', 'purpose', 'date', 'images', 'qrcode', 'property_url'].map(field => (
                <Badge
                  key={field}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => insertPlaceholder(field)}
                  title={field === 'property_url' ? 'Link da página pública do imóvel' : `Inserir ${field}`}
                >
                  {`{{${field}}}`}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Controles */}
          <div>
            <p className="font-medium text-xs text-muted-foreground mb-1">Controles de Formatação</p>
            <div className="flex flex-wrap gap-1">
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={() => editor.chain().focus().insertContent('<p>{{line_break}}</p>').run()}
                title="Inserir linha em branco (espaçamento extra)"
              >
                📏 Linha em Branco
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Use <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> para pular linha normal ou clique no botão acima para espaçamento extra
            </p>
          </div>

          {/* Proprietário */}
          <div>
            <p className="font-medium text-xs text-muted-foreground mb-1">Proprietário</p>
            <div className="flex flex-wrap gap-1">
              {['owner_name', 'owner_cpf_cnpj', 'owner_email', 'owner_phone', 'full_address'].map(field => (
                <Badge
                  key={field}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => insertPlaceholder(field)}
                >
                  {`{{${field}}}`}
                </Badge>
              ))}
            </div>
          </div>

          {/* Empresa e Sistema */}
          <div>
            <p className="font-medium text-xs text-muted-foreground mb-1">Empresa / Sistema</p>
            <div className="flex flex-wrap gap-1">
              {['agency_name', 'system_logo', 'company_logo', 'company_primary_color', 'company_secondary_color'].map(field => (
                <Badge
                  key={field}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => insertPlaceholder(field)}
                >
                  {`{{${field}}}`}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Help Text - Será removido ou ajustado */}
      <div className="bg-muted p-2 border-t text-xs text-muted-foreground hidden">
        <strong>Campos dinâmicos:</strong> Use {`{{campo}}`} para inserir valores do imóvel.
        Ex: {`{{title}}, {{price}}, {{bedrooms}}, {{city}}, {{neighborhood}}`}
      </div>
    </div>
  );
}

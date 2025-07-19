
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3,
  Move,
  Type,
  AlignLeft
} from 'lucide-react';
import { PDFTemplate, PDFSection } from '@/lib/pdfGenerator';

interface PDFTemplateEditorProps {
  template: PDFTemplate;
  onChange: (template: PDFTemplate) => void;
}

export function PDFTemplateEditor({ template, onChange }: PDFTemplateEditorProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const updateTemplate = (updates: Partial<PDFTemplate>) => {
    onChange({ ...template, ...updates });
  };

  const updateSection = (sectionId: string, updates: Partial<PDFSection>) => {
    const updatedSections = template.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateTemplate({ sections: updatedSections });
  };

  const addSection = () => {
    const newSection: PDFSection = {
      id: `section-${Date.now()}`,
      type: 'content',
      title: 'Neuer Bereich',
      position: { x: 5, y: 50 },
      size: { width: 100, height: 20 },
      style: { fontSize: 11, fontFamily: 'Helvetica' },
      fields: []
    };
    updateTemplate({ sections: [...template.sections, newSection] });
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = template.sections.filter(section => section.id !== sectionId);
    updateTemplate({ sections: updatedSections });
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const addField = (sectionId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (section) {
      const newField = {
        key: 'neues.feld',
        label: 'Neues Feld',
        required: false
      };
      updateSection(sectionId, {
        fields: [...section.fields, newField]
      });
    }
  };

  const updateField = (sectionId: string, fieldIndex: number, updates: any) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (section) {
      const updatedFields = section.fields.map((field, index) =>
        index === fieldIndex ? { ...field, ...updates } : field
      );
      updateSection(sectionId, { fields: updatedFields });
    }
  };

  const removeField = (sectionId: string, fieldIndex: number) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (section) {
      const updatedFields = section.fields.filter((_, index) => index !== fieldIndex);
      updateSection(sectionId, { fields: updatedFields });
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Settings */}
      <Card className="p-4 bg-muted/20 border-border/30">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
          <Edit3 className="w-4 h-4 mr-2" />
          Template-Einstellungen
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={template.name}
              onChange={(e) => updateTemplate({ name: e.target.value })}
              placeholder="Template Name"
            />
          </div>
          <div>
            <Label htmlFor="template-type">Typ</Label>
            <Input
              id="template-type"
              value={template.type}
              onChange={(e) => updateTemplate({ type: e.target.value as any })}
              placeholder="PDF Typ"
            />
          </div>
        </div>
      </Card>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center">
            <AlignLeft className="w-4 h-4 mr-2" />
            Template-Bereiche
          </h3>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="w-4 h-4 mr-2" />
            Bereich hinzufügen
          </Button>
        </div>

        <div className="space-y-3">
          {template.sections.map((section) => (
            <Card key={section.id} className="p-4 bg-background border-border/30">
              <div className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div>
                      <h4 className="font-medium text-foreground">{section.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {section.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSection(
                        selectedSection === section.id ? null : section.id
                      )}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Section Details - Expandable */}
                {selectedSection === section.id && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {/* Basic Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Titel</Label>
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Typ</Label>
                          <Input
                            value={section.type}
                            onChange={(e) => updateSection(section.id, { type: e.target.value as any })}
                          />
                        </div>
                      </div>

                      {/* Position & Size */}
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label>X (mm)</Label>
                          <Input
                            type="number"
                            value={section.position.x}
                            onChange={(e) => updateSection(section.id, {
                              position: { ...section.position, x: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Y (mm)</Label>
                          <Input
                            type="number"
                            value={section.position.y}
                            onChange={(e) => updateSection(section.id, {
                              position: { ...section.position, y: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Breite</Label>
                          <Input
                            type="number"
                            value={section.size.width}
                            onChange={(e) => updateSection(section.id, {
                              size: { ...section.size, width: Number(e.target.value) }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Höhe</Label>
                          <Input
                            type="number"
                            value={section.size.height}
                            onChange={(e) => updateSection(section.id, {
                              size: { ...section.size, height: Number(e.target.value) }
                            })}
                          />
                        </div>
                      </div>

                      {/* Fields */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label>Felder</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addField(section.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Feld
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {section.fields.map((field, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-muted/30 rounded">
                              <Type className="w-3 h-3 text-muted-foreground" />
                              <Input
                                placeholder="Feld-Key (z.B. kunde.name)"
                                value={field.key}
                                onChange={(e) => updateField(section.id, index, { key: e.target.value })}
                                className="text-xs"
                              />
                              <Input
                                placeholder="Label"
                                value={field.label}
                                onChange={(e) => updateField(section.id, index, { label: e.target.value })}
                                className="text-xs"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeField(section.id, index)}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

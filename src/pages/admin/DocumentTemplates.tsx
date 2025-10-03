import { useState } from 'react';
import { Trash2, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDocumentTemplates, useCreateDocumentTemplate, useUpdateDocumentTemplate, useDeleteDocumentTemplate } from '@/hooks/useDocumentTemplates';
import { formatGermanDate } from '@/lib/documentHelpers';

const DocumentTemplates = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'rechnung' | 'angebot' | 'mahnung' | 'sonstiges'>('rechnung');

  const { data: templates, isLoading } = useDocumentTemplates();
  const createTemplate = useCreateDocumentTemplate();
  const updateTemplate = useUpdateDocumentTemplate();
  const deleteTemplate = useDeleteDocumentTemplate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        alert('Bitte wählen Sie eine .docx-Datei aus');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Datei ist zu groß. Maximal 10MB erlaubt.');
        return;
      }
      setSelectedFile(file);
      if (!templateName) {
        setTemplateName(file.name.replace('.docx', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !templateName) {
      alert('Bitte wählen Sie eine Datei aus und geben Sie einen Namen ein');
      return;
    }

    await createTemplate.mutateAsync({
      templateInput: { name: templateName, template_type: templateType },
      file: selectedFile,
    });

    setSelectedFile(null);
    setTemplateName('');
    setTemplateType('rechnung');
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await updateTemplate.mutateAsync({
      id,
      updates: { is_active: !currentStatus },
    });
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
  };

  const getTemplateTypeLabel = (type: string) => {
    const labels = {
      rechnung: 'Rechnung',
      angebot: 'Angebot',
      mahnung: 'Mahnung',
      sonstiges: 'Sonstiges',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vorlagen verwalten</h1>
        <p className="text-muted-foreground mt-2">
          Laden Sie DOCX-Vorlagen hoch und verwalten Sie diese
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neue Vorlage hochladen</CardTitle>
          <CardDescription>
            Wählen Sie eine .docx-Datei aus (max. 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Vorlagenname *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="z.B. Standard Rechnung"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateType">Typ *</Label>
              <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rechnung">Rechnung</SelectItem>
                  <SelectItem value="angebot">Angebot</SelectItem>
                  <SelectItem value="mahnung">Mahnung</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Datei auswählen *</Label>
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="flex-1"
              />
              {selectedFile && (
                <span className="text-sm text-muted-foreground flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  {selectedFile.name}
                </span>
              )}
            </div>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !templateName || createTemplate.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {createTemplate.isPending ? 'Wird hochgeladen...' : 'Vorlage hochladen'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vorhandene Vorlagen</CardTitle>
          <CardDescription>
            Verwalten Sie Ihre hochgeladenen Vorlagen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Lade Vorlagen...
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Hochgeladen am</TableHead>
                    <TableHead>Aktiv</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getTemplateTypeLabel(template.template_type)}</TableCell>
                      <TableCell>{formatGermanDate(template.created_at)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => handleToggleActive(template.id, template.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie die Vorlage "{template.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Keine Vorlagen vorhanden. Laden Sie Ihre erste Vorlage hoch.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentTemplates;

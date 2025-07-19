import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Kanzlei, KanzleiInput, useCreateKanzlei, useUpdateKanzlei, useUploadLogo } from '@/hooks/useKanzleien';
import { Loader2, Upload, X, Image } from 'lucide-react';

const kanzleiSchema = z.object({
  name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  strasse: z.string().min(1, 'Straße ist erforderlich'),
  plz: z.string()
    .min(5, 'PLZ muss mindestens 5 Zeichen haben')
    .max(5, 'PLZ darf maximal 5 Zeichen haben')
    .regex(/^\d+$/, 'PLZ darf nur Zahlen enthalten'),
  stadt: z.string().min(1, 'Stadt ist erforderlich'),
  rechtsanwalt: z.string().min(1, 'Rechtsanwalt ist erforderlich'),
  telefon: z.string().min(1, 'Telefon ist erforderlich'),
  fax: z.string().optional(),
  email: z.string().email('Ungültige E-Mail Adresse').optional().or(z.literal('')),
  website: z.string().url('Ungültige URL').optional().or(z.literal('')),
  registergericht: z.string().optional(),
  register_nr: z.string().optional(),
  ust_id: z.string().optional(),
});

type KanzleiFormData = z.infer<typeof kanzleiSchema>;

interface KanzleiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanzlei?: Kanzlei;
}

export function KanzleiForm({ open, onOpenChange, kanzlei }: KanzleiFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(kanzlei?.logo_url || null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const createKanzlei = useCreateKanzlei();
  const updateKanzlei = useUpdateKanzlei();
  const uploadLogo = useUploadLogo();
  
  const isEditing = !!kanzlei;
  const isLoading = createKanzlei.isPending || updateKanzlei.isPending || uploadLogo.isPending;

  const form = useForm<KanzleiFormData>({
    resolver: zodResolver(kanzleiSchema),
    defaultValues: {
      name: kanzlei?.name || '',
      strasse: kanzlei?.strasse || '',
      plz: kanzlei?.plz || '',
      stadt: kanzlei?.stadt || '',
      rechtsanwalt: kanzlei?.rechtsanwalt || '',
      telefon: kanzlei?.telefon || '',
      fax: kanzlei?.fax || '',
      email: kanzlei?.email || '',
      website: kanzlei?.website || '',
      registergericht: kanzlei?.registergericht || '',
      register_nr: kanzlei?.register_nr || '',
      ust_id: kanzlei?.ust_id || '',
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = async (data: KanzleiFormData) => {
    try {
      let logoUrl = logoPreview;

      // Upload logo if a new file was selected
      if (logoFile) {
        logoUrl = await uploadLogo.mutateAsync(logoFile);
      }

      const kanzleiInput: KanzleiInput = {
        name: data.name,
        strasse: data.strasse,
        plz: data.plz,
        stadt: data.stadt,
        rechtsanwalt: data.rechtsanwalt,
        telefon: data.telefon,
        fax: data.fax || null,
        email: data.email || null,
        website: data.website || null,
        registergericht: data.registergericht || null,
        register_nr: data.register_nr || null,
        ust_id: data.ust_id || null,
        logo_url: logoUrl,
      };

      if (isEditing && kanzlei) {
        await updateKanzlei.mutateAsync({ id: kanzlei.id, kanzlei: kanzleiInput });
      } else {
        await createKanzlei.mutateAsync(kanzleiInput);
      }
      
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleClose = () => {
    form.reset();
    setLogoFile(null);
    setLogoPreview(kanzlei?.logo_url || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-4xl max-h-[90vh] overflow-y-auto border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary font-orbitron">
            {isEditing ? 'Kanzlei bearbeiten' : 'Neue Kanzlei'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Logo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Logo hier ablegen oder klicken zum Auswählen
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PNG, JPG bis 2MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={isLoading}
                  >
                    Datei auswählen
                  </Button>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="text-sm font-medium text-foreground mb-2">Vorschau</h4>
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo Vorschau"
                        className="max-w-full h-32 object-contain mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeLogo}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center border border-dashed rounded">
                      <div className="text-center text-muted-foreground">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Kein Logo ausgewählt</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Unternehmensname *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Kanzlei Müller & Partner" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strasse"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Straße & Hausnummer *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Hauptstraße 123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PLZ *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12345" maxLength={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stadt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stadt *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Berlin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rechtsanwalt"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Rechtsanwalt *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dr. Max Mustermann" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+49 30 12345678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fax</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+49 30 12345679" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="info@kanzlei.de" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://www.kanzlei.de" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registergericht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registergericht</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Amtsgericht Berlin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="register_nr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Register-Nr.</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="HRB 12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ust_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ust-ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="DE123456789" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="gaming"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditing ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
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
import { Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const kanzleiSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  strasse: z.string().min(1, 'Straße ist erforderlich'),
  plz: z.string()
    .min(5, 'PLZ muss mindestens 5 Zeichen haben')
    .max(5, 'PLZ darf maximal 5 Zeichen haben')
    .regex(/^\d+$/, 'PLZ darf nur Zahlen enthalten'),
  stadt: z.string().min(1, 'Stadt ist erforderlich'),
  rechtsanwalt: z.string().min(1, 'Rechtsanwalt ist erforderlich'),
  telefon: z.string().min(1, 'Telefon ist erforderlich'),
  fax: z.string().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  website: z.string().url('Ungültige Website-URL').optional().or(z.literal('')),
  registergericht: z.string().optional(),
  register_nr: z.string().optional(),
  ust_id: z.string().optional(),
  logo_url: z.string().optional(),
});

interface KanzleiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanzlei?: Kanzlei;
}

export function KanzleiForm({ open, onOpenChange, kanzlei }: KanzleiFormProps) {
  const createKanzlei = useCreateKanzlei();
  const updateKanzlei = useUpdateKanzlei();
  const uploadLogo = useUploadLogo();
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const isEditing = !!kanzlei;
  const isLoading = createKanzlei.isPending || updateKanzlei.isPending || uploadLogo.isPending;

  const form = useForm<KanzleiInput>({
    resolver: zodResolver(kanzleiSchema),
    defaultValues: {
      name: '',
      strasse: '',
      plz: '',
      stadt: '',
      rechtsanwalt: '',
      telefon: '',
      fax: '',
      email: '',
      website: '',
      registergericht: '',
      register_nr: '',
      ust_id: '',
      logo_url: '',
    },
  });

  // Reset form when kanzlei data changes or dialog opens/closes
  useEffect(() => {
    if (open && kanzlei) {
      // Editing existing kanzlei - populate with actual values
      form.reset({
        name: kanzlei.name || '',
        strasse: kanzlei.strasse || '',
        plz: kanzlei.plz || '',
        stadt: kanzlei.stadt || '',
        rechtsanwalt: kanzlei.rechtsanwalt || '',
        telefon: kanzlei.telefon || '',
        fax: kanzlei.fax || '',
        email: kanzlei.email || '',
        website: kanzlei.website || '',
        registergericht: kanzlei.registergericht || '',
        register_nr: kanzlei.register_nr || '',
        ust_id: kanzlei.ust_id || '',
        logo_url: kanzlei.logo_url || '',
      });
      setLogoPreview(kanzlei.logo_url);
    } else if (open && !kanzlei) {
      // Creating new kanzlei - reset to empty values
      form.reset({
        name: '',
        strasse: '',
        plz: '',
        stadt: '',
        rechtsanwalt: '',
        telefon: '',
        fax: '',
        email: '',
        website: '',
        registergericht: '',
        register_nr: '',
        ust_id: '',
        logo_url: '',
      });
      setLogoPreview(null);
      setLogoFile(null);
    }
  }, [open, kanzlei, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = async () => {
    if (kanzlei?.logo_url) {
      const logoPath = kanzlei.logo_url.split('/').pop();
      if (logoPath) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.storage
            .from('kanzlei-logos')
            .remove([`${user.id}/${logoPath}`]);
        }
      }
    }
    setLogoFile(null);
    setLogoPreview(null);
    form.setValue('logo_url', '');
  };

  const onSubmit = async (data: KanzleiInput) => {
    try {
      let logoUrl = data.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        logoUrl = await uploadLogo.mutateAsync(logoFile);
      }

      const kanzleiData = { ...data, logo_url: logoUrl };

      if (isEditing && kanzlei) {
        await updateKanzlei.mutateAsync({ id: kanzlei.id, kanzlei: kanzleiData });
      } else {
        await createKanzlei.mutateAsync(kanzleiData);
      }
      
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleClose = () => {
    form.reset();
    setLogoFile(null);
    setLogoPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-4xl border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary font-orbitron">
            {isEditing ? 'Kanzlei bearbeiten' : 'Neue Kanzlei'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-4">
              <FormLabel>Logo</FormLabel>
              <div className="flex items-center space-x-4">
                {logoPreview && (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-20 h-20 object-contain border rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={removeLogo}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Logo hochladen
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG oder PNG, max. 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Name der Kanzlei *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Muster & Partner Rechtsanwälte" />
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
                    <FormLabel>Straße und Hausnummer *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Musterstraße 123" />
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
                    <FormLabel>USt-ID</FormLabel>
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

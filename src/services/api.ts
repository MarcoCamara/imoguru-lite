import { supabase } from '@/integrations/supabase/client';

class ApiService {
  // User endpoints
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) throw rolesError;

    return {
      ...profile,
      roles: roles?.map(r => r.role) || [],
    };
  }

  async updateProfile(data: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;

    // Para cada usuário, buscar suas roles
    const usersWithRoles = await Promise.all(
      data.map(async (profile) => {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id);

        return {
          ...profile,
          roles: roles?.map(r => r.role) || [],
        };
      })
    );

    return usersWithRoles;
  }

  async deleteUser(userId: string) {
    // Não podemos deletar usuários do auth.users, apenas desativar
    // Por enquanto apenas retornamos erro
    throw new Error('User deletion not supported through this method');
  }

  async updateUserRole(userId: string, role: string) {
    // Remover roles antigas
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Adicionar nova role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role: role as any }]);

    if (insertError) throw insertError;

    return { success: true };
  }

  // Properties endpoints
  async getProperties(filters?: any) {
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.purpose) query = query.eq('purpose', filters.purpose);
      if (filters.property_type) query = query.eq('property_type', filters.property_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getProperty(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createProperty(data: any) {
    const { data: property, error } = await supabase
      .from('properties')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return property;
  }

  async updateProperty(id: string, data: any) {
    const { data: property, error } = await supabase
      .from('properties')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return property;
  }

  async deleteProperty(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  // Companies endpoints
  async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*');

    if (error) throw error;
    return data;
  }

  async getCompany(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createCompany(data: any) {
    const { data: company, error } = await supabase
      .from('companies')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return company;
  }

  async updateCompany(id: string, data: any) {
    const { data: company, error } = await supabase
      .from('companies')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return company;
  }

  async deleteCompany(id: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  // Templates endpoints
  async getShareTemplates() {
    const { data, error } = await supabase
      .from('share_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getPrintTemplates() {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getAuthorizationTemplates() {
    const { data, error } = await supabase
      .from('authorization_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createTemplate(type: string, data: any) {
    const table = `${type}_templates` as any;
    const { data: template, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return template;
  }

  async updateTemplate(type: string, id: string, data: any) {
    const table = `${type}_templates` as any;
    const { data: template, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return template;
  }

  async deleteTemplate(type: string, id: string) {
    const table = `${type}_templates` as any;
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  // Email endpoints - seria necessário criar edge function
  async sendPropertyEmail(propertyId: string, recipients: string[]) {
    throw new Error('Email sending not yet implemented');
  }

  // Upload endpoints - usar Supabase Storage
  async uploadPropertyImages(propertyId: string, files: File[]) {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);

      // Salvar referência no banco
      await supabase.from('property_images').insert({
        property_id: propertyId,
        url: data.publicUrl,
      });
    }

    return { urls: uploadedUrls };
  }

  async uploadPropertyVideo(propertyId: string, file: File, title?: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('property-videos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('property-videos')
      .getPublicUrl(fileName);

    // Salvar referência no banco
    await supabase.from('property_videos').insert({
      property_id: propertyId,
      url: data.publicUrl,
      title: title || file.name,
    });

    return { url: data.publicUrl };
  }

  async uploadPropertyDocuments(propertyId: string, files: File[], documentType: string) {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);

      // Salvar referência no banco
      await supabase.from('property_documents').insert({
        property_id: propertyId,
        file_url: data.publicUrl,
        file_name: file.name,
        document_type: documentType,
      });
    }

    return { urls: uploadedUrls };
  }

  async uploadCompanyLogo(companyId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName);

    // Atualizar a empresa com a URL do logo
    await supabase
      .from('companies')
      .update({ logo_url: data.publicUrl })
      .eq('id', companyId);

    return { url: data.publicUrl };
  }

  // File download endpoints
  getPropertyDocumentUrl(filename: string) {
    const { data } = supabase.storage
      .from('property-documents')
      .getPublicUrl(filename);
    return data.publicUrl;
  }

  getPropertyVideoUrl(filename: string) {
    const { data } = supabase.storage
      .from('property-videos')
      .getPublicUrl(filename);
    return data.publicUrl;
  }
}

export const apiService = new ApiService();
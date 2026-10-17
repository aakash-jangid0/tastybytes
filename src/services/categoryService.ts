import { supabase } from '../lib/supabase';
import { Category } from '../types/category';

export type CategoryInput = Pick<Category, 'name' | 'slug' | 'display_order' | 'icon'>;

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createCategory = async (category: CategoryInput): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, category: CategoryInput): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateCategoryOrder = async (categories: Category[]): Promise<void> => {
  const results = await Promise.all(categories.map(({ id, display_order }) =>
    supabase
      .from('categories')
      .update({ display_order })
      .eq('id', id)
  ));
  const failedUpdate = results.find(result => result.error)?.error;
  if (failedUpdate) throw failedUpdate;
};

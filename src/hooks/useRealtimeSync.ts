import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface RealtimeSyncProps<T> {
  table: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: Partial<T>) => void;
  filter?: string;
}

export function useRealtimeSync<T extends { id: string | number }>({ 
  table, 
  onInsert, 
  onUpdate, 
  onDelete, 
  filter 
}: RealtimeSyncProps<T>) {
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter ? { filter } : {})
        },
        async (payload) => {
          try {
            const { onInsert: handleInsert, onUpdate: handleUpdate, onDelete: handleDelete } = callbacksRef.current;
            // For UPDATE and INSERT, fetch the complete record with relationships
            if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && 
                (handleUpdate || handleInsert)) {
              
              const { data, error } = await supabase
                .from(table)
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .single<T>();
              
              if (!error) {
                if (payload.eventType === 'INSERT' && handleInsert) {
                  handleInsert(data);
                } else if (payload.eventType === 'UPDATE' && handleUpdate) {
                  handleUpdate(data);
                }
              } else {
                console.error(`Error fetching ${table} data:`, error);
              }
            } 
            // For DELETE, just pass the payload data
            else if (payload.eventType === 'DELETE' && handleDelete) {
              handleDelete(payload.old as Partial<T>);
            }
          } catch (error) {
            console.error(`Error in realtime sync for ${table}:`, error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`);
          toast.dismiss(`${table}-realtime-error`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Realtime subscription for ${table} failed:`, status);
          toast.error(`Failed to subscribe to ${table} changes`, {
            id: `${table}-realtime-error`
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
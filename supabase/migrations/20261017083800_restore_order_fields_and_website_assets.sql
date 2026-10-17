ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS has_feedback boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS actual_completion_time timestamptz;

UPDATE public.orders AS orders
SET has_feedback = EXISTS (
  SELECT 1
  FROM public.order_feedback AS feedback
  WHERE feedback.order_id = orders.id
)
WHERE orders.has_feedback IS DISTINCT FROM EXISTS (
  SELECT 1
  FROM public.order_feedback AS feedback
  WHERE feedback.order_id = orders.id
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('website-assets', 'website-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create a table for custom checklist items
CREATE TABLE public.custom_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_checklist_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own checklist items" 
ON public.custom_checklist_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklist items" 
ON public.custom_checklist_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist items" 
ON public.custom_checklist_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist items" 
ON public.custom_checklist_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_checklist_items_updated_at
BEFORE UPDATE ON public.custom_checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default checklist items for all existing users
INSERT INTO public.custom_checklist_items (user_id, item_name, is_default)
SELECT DISTINCT user_id, 'babySitter', true FROM public.upcoming_dates
UNION ALL
SELECT DISTINCT user_id, 'outfit', true FROM public.upcoming_dates
UNION ALL
SELECT DISTINCT user_id, 'hairStyling', true FROM public.upcoming_dates
UNION ALL
SELECT DISTINCT user_id, 'backgroundCheck', true FROM public.upcoming_dates
UNION ALL
SELECT DISTINCT user_id, 'emergencyCash', true FROM public.upcoming_dates
UNION ALL
SELECT DISTINCT user_id, 'weatherCheck', true FROM public.upcoming_dates;
-- Create upcoming_dates table for personal date planning
CREATE TABLE public.upcoming_dates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  prospect_id uuid REFERENCES public.dating_prospects(id) ON DELETE SET NULL,
  location text NOT NULL,
  date_time timestamp with time zone NOT NULL,
  checklist jsonb NOT NULL DEFAULT '{"babySitter": false, "outfit": false, "hairStyling": false, "backgroundCheck": false, "emergencyCash": false, "weatherCheck": false}'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.upcoming_dates ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own upcoming dates" 
ON public.upcoming_dates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own upcoming dates" 
ON public.upcoming_dates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upcoming dates" 
ON public.upcoming_dates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upcoming dates" 
ON public.upcoming_dates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_upcoming_dates_updated_at
BEFORE UPDATE ON public.upcoming_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
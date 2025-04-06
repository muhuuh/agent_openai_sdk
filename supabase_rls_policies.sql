-- Enable Row Level Security on the todo_api_keys table
ALTER TABLE todo_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select only their own API keys
CREATE POLICY "Users can view their own API keys" 
ON todo_api_keys FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to insert their own API keys
CREATE POLICY "Users can insert their own API keys" 
ON todo_api_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update only their own API keys
CREATE POLICY "Users can update their own API keys" 
ON todo_api_keys FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for users to delete only their own API keys
CREATE POLICY "Users can delete their own API keys" 
ON todo_api_keys FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure the todo_api_keys table has the correct structure
/*
If you need to create the table:

CREATE TABLE todo_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Add any additional constraints
  CONSTRAINT proper_name CHECK (length(name) > 0),
  CONSTRAINT proper_token CHECK (length(token) > 0)
);

CREATE INDEX todo_api_keys_user_id_idx ON todo_api_keys(user_id);
*/ 
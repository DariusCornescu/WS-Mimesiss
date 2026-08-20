# Database Setup Instructions

## Step 1: Run the Database Setup SQL

1. **Open your Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Setup Script**
   - Copy the entire contents of `database-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute all the commands

## Step 2: Create Your First Admin User

After running the setup, you'll need to create an admin user:

1. **Sign up for a new account** through your app
2. **Go to Supabase Dashboard** → Authentication → Users
3. **Find your user** in the list
4. **Copy your User ID** (UUID)
5. **Go to SQL Editor** and run this command:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_ID_HERE';
```

Replace `YOUR_USER_ID_HERE` with your actual user ID.

## Step 3: Test the System

1. **Sign in** to your account
2. **Go to the admin panel** at `/admin`
3. **Create a workshop** using the "Create Workshop" button
4. **Test the functionality** - create, view, and delete workshops

## What Gets Created

The setup creates:

- **profiles table** - User information and roles
- **workshops table** - Workshop details and management
- **workshop_registrations table** - User workshop registrations
- **Row Level Security policies** - Proper access control
- **Triggers and functions** - Automatic profile creation and participant counting

## Troubleshooting

### If you get "Access Denied" after setting admin role

1. **Check your debug page** - Visit `/debug` in your app to see your user and profile info

2. **Verify the profile exists**:

   ```sql
   SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
   ```

3. **If no profile exists, create one manually**:

   ```sql
   INSERT INTO profiles (id, email, full_name, role) 
   VALUES ('YOUR_USER_ID', 'your-email@example.com', 'Your Name', 'admin');
   ```

4. **If profile exists but role is wrong, update it**:

   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
   ```

5. **Clear browser cache and restart the dev server**:

   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

6. **Check the browser console** for any error messages

### Common Issues

- **Profile not created**: The trigger might not have fired during signup
- **Caching**: Browser or server-side caching might show old data  
- **Typos**: Double-check the user ID matches exactly
- **RLS Policies**: Ensure the policies allow admin access

If you encounter any other issues:

1. Check the SQL Editor for error messages
2. Ensure all commands ran successfully  
3. Visit `/debug` to see detailed user information
4. Check the browser console for any JavaScript errors

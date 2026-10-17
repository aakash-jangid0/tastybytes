# First time to setup git and upload project

# Navigate to your project folder
cd "path/to/your/project"

git config --global user.name "Aakash Jangid"
git config --global user.email "aakashjangid0@gmail.com"

git remote set-url origin https://github.com/aakash-jangid0/Netlify.git

git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main

# force push
git push -f origin main


# To push updates from local to git

# Check status
git status

# Stage changed files
git add .

# un-Stage file
git reset HEAD<file-name>

# Commit with message
git commit -m "Your update message"

# Push changes
git push origin main

# create a new branch
git branch branch-name

# To move to another branch
git checkout branch-name



# Clone repo

# Go to the parent directory where you want the project
cd "C:/path/to/your/desired/location"

# Clone from GitHub
git clone https://github.com/your-username/your-repo.git



# Update your local project with latest changes from GitHub
git pull origin main


# Option A: The "Safe" Way (git revert)
This is the best practice. Instead of deleting history, it creates a new commit that does the exact opposite of the bad commit. It's like an "antidote."
1. Find the ID of the bad commit: git log --oneline (e.g., a1b2c3d)
2. Run: git revert a1b2c3d
3. Push to GitHub: git push
* Result: Your live site goes back to the working state, and your Git history stays clean and honest.

# Option B: The "Hard Reset" (git reset --hard)
This is like using a time machine to delete the last hour of your life. It wipes out your recent work completely.
1. git reset --hard HEAD~1 (This moves you back 1 commit).
2. To fix GitHub: git push -f origin main (You must use -f here because GitHub will be confused why you're "going back in time").
* Warning: Use this only if you are 100% sure you don't want those files back!

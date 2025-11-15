# 🚀 How to Submit Your Pull Request - Step by Step Guide

## 📋 Pre-Submission Checklist

Before creating your PR, make sure:

- [ ] All features are working correctly
- [ ] `.env` file is created with Perplexity API key (but NOT committed)
- [ ] No linter errors (`npm run lint` or check editor)
- [ ] Dark mode works and persists
- [ ] Character counter shows all states
- [ ] AI suggestions generate successfully
- [ ] Search and filter work together
- [ ] Documentation is updated

---

## 🎯 Step-by-Step PR Submission

### **Step 1: Fork the Repository** (If you haven't already)

1. Go to: https://github.com/Loopdesk-AI/social-media-scheduler
2. Click the **"Fork"** button (top right)
3. This creates a copy in your GitHub account

---

### **Step 2: Create Your Feature Branch**

Open terminal/PowerShell in your project folder:

```bash
# Navigate to the project
cd social-media-scheduler

# Check your current branch
git branch

# Create your feature branch (replace [your-name] with YOUR actual name)
git checkout -b intern-challenge-[your-name]

# Example:
# git checkout -b intern-challenge-john-smith
```

**Important:** Use your actual name, not the placeholder!

---

### **Step 3: Check What Files Changed**

```bash
# See what files you've modified
git status
```

You should see files in red (not staged). This is normal!

---

### **Step 4: Stage All Your Changes**

```bash
# Add all changed files
git add .

# Verify files are staged (should be green now)
git status
```

**Important:** Make sure `.env` is NOT in the list (it should be ignored by `.gitignore`)

---

### **Step 5: Commit Your Changes**

Copy this EXACT commit message (just replace [Your Name]):

```bash
git commit -m "feat: Implement dark mode, character counter, search/filter, and AI suggestions (11 points)

- E1: Dark Mode Toggle (2 points)
  * ThemeContext with localStorage persistence
  * DarkModeToggle component in navigation
  * Updated all 15+ components with light/dark support
  * Smooth 200ms transitions
  
- E2: Post Character Counter (2 points)
  * CharacterCounter component with visual states
  * Platform-specific limits (X: 280, LinkedIn: 3K, etc.)
  * Warning (90%) and error (>100%) indicators
  * Real-time progress bar

- E4: Search and Filter Posts (2 points)
  * Real-time search by content
  * Platform and status filter dropdowns
  * Combined filtering with live results
  * Color-coded post cards on calendar
  * 6 sample posts pre-loaded for testing
  
- H2: AI-Powered Content Suggestions (5 points)
  * Perplexity API integration with sonar-pro model
  * 7 tone options for content generation
  * Rate limiting (20 req/hour) with localStorage
  * Retry logic with exponential backoff
  * Beautiful gradient UI with copy/insert actions

- BONUS: Bug Fixes
  * Fixed missing imports in SchedulePostModal
  * Fixed activeTab state variable
  * Cleaned up linter warnings

Total: 11/5 points (220% of requirement)

Submitted by: [Your Name]"
```

Press Enter after pasting. You should see a message about files changed.

---

### **Step 6: Push to Your Fork**

```bash
# Push your branch to YOUR GitHub fork
# Replace [your-name] with the same name you used in the branch
git push origin intern-challenge-[your-name]

# Example:
# git push origin intern-challenge-john-smith
```

**If this is your first push:**
- Git might ask you to set upstream. Just run the command it suggests:
```bash
git push --set-upstream origin intern-challenge-[your-name]
```

**If Git asks for credentials:**
- Use your GitHub username
- For password, use a Personal Access Token (not your actual password)
- [How to create token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

### **Step 7: Create Pull Request on GitHub**

1. **Go to GitHub:**
   - Visit: https://github.com/Loopdesk-AI/social-media-scheduler
   - You should see a yellow banner saying "Compare & pull request"
   - Click that button!

   **OR**

   - Click "Pull requests" tab
   - Click green "New pull request" button
   - Click "compare across forks"
   - Select your fork and branch

2. **Fill in PR Details:**

   **Title:** (Copy this exactly, replace [Your Name])
   ```
   [Intern Challenge] [Your Name] - 11 points
   ```

   **Description:** 
   - Open the file `PR_TEMPLATE.md` we created
   - Copy the ENTIRE contents
   - Paste into the PR description box
   - Replace `[Your Name]` with your actual name
   - Add your contact info at the bottom

3. **Create the PR:**
   - Double-check everything looks good
   - Click green **"Create pull request"** button
   - 🎉 Done!

---

### **Step 8: Fill Out the Hiring Form**

Go to: https://tally.so/r/VLE7rj

Fill in:
- Your name
- Email
- Link to your Pull Request
- Total points: **11**
- Brief description:
  ```
  Implemented 4 features (E1, E2, E4, H2) totaling 11 points, 
  plus fixed critical bugs in the original codebase. Features 
  include dark mode with localStorage, character counter with 
  warnings, search/filter for posts, and AI-powered content 
  suggestions using Perplexity API. All with zero linter errors 
  and comprehensive documentation.
  ```

---

## 🎯 PR Title Format Examples

Good PR titles:
- ✅ `[Intern Challenge] John Smith - 11 points`
- ✅ `[Intern Challenge] Sarah Johnson - 11 points`
- ✅ `[Intern Challenge] Alex Kumar - 11 points`

Bad PR titles:
- ❌ `Update files`
- ❌ `My submission`
- ❌ `Challenge complete`

---

## 📝 What Reviewers Will See

When they open your PR, they'll see:

1. **Your PR description** - From PR_TEMPLATE.md
2. **Files changed** - All your code
3. **Commit history** - Your commit message
4. **Documentation** - Updated README, FEATURES.md, etc.

Make sure it all looks professional!

---

## 🔍 Common Issues & Solutions

### Issue 1: "Nothing to commit"
**Solution:** 
```bash
git status
# If files show as "Untracked", run:
git add .
git commit -m "your message"
```

### Issue 2: "Failed to push"
**Possible causes:**
- Branch name doesn't match: Use the exact same name in push command
- No upstream: Run the command Git suggests with `--set-upstream`
- Authentication: Use Personal Access Token, not password

### Issue 3: ".env file in commit"
**Solution:**
```bash
# Remove .env from staging
git reset HEAD .env

# Make sure .gitignore has .env
echo ".env" >> .gitignore

# Commit again
git commit -m "your message"
```

### Issue 4: "Can't find the yellow banner on GitHub"
**Solution:**
1. Go to YOUR fork: `https://github.com/YOUR-USERNAME/social-media-scheduler`
2. You should see the banner there
3. If not, click "Pull requests" → "New pull request"
4. Make sure base is `Loopdesk-AI/social-media-scheduler` and compare is your branch

---

## ✅ Final Checklist Before Clicking "Create Pull Request"

- [ ] PR title follows format: `[Intern Challenge] [Your Name] - 11 points`
- [ ] PR description is filled out (from PR_TEMPLATE.md)
- [ ] Your name is in the description (not placeholder)
- [ ] Files changed look correct (no .env, no node_modules)
- [ ] Commit message is clear and descriptive
- [ ] README.md is updated
- [ ] FEATURES.md exists and is complete

---

## 🎉 After Submitting

1. **Share your PR link** in the hiring form
2. **Wait for review** - They'll look at your code
3. **Be ready to answer questions** about your implementation
4. **Celebrate!** 🎊 You did it!

---

## 💡 Pro Tips

1. **Take screenshots** of your features working (for your portfolio)
2. **Keep the terminal output** showing no errors
3. **Test one more time** before submitting
4. **Read your PR description** as if you were the reviewer
5. **Double-check** all placeholders like [Your Name] are replaced

---

## 📞 Still Stuck?

If you're having trouble with Git/GitHub:

1. Check the [GitHub Docs](https://docs.github.com/en/pull-requests)
2. Make sure you're in the right directory (`cd social-media-scheduler`)
3. Verify your changes are saved (check file timestamps)
4. Try `git status` to see current state

---

## 🏆 You're Ready!

You've built an amazing submission with:
- ✅ 11 points worth of features
- ✅ Bug fixes in original code
- ✅ Zero linter errors
- ✅ Comprehensive documentation
- ✅ Professional code quality

**Now go submit that PR and show them what you've got!** 🚀

Good luck! 🍀


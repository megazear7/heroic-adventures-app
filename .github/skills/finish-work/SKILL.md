---
name: finish-work
description: 'Mark a task or feature as complete and perform the final branch, commit, pull request, and merge workflow.'
---

1. Ensure you are on the `main` branch.
2. Add all changes to staging with `git add .`.
3. Look at the current changes with `git status` or `git diff` to understand the changes.
4. Checkout a new branch.
5. Commit the changes with a clear and descriptive message.
6. Push the branch to the remote repository.
7. Use `gh` to open a pull request with a descriptive title and very detailed description. The description should not reference file names and code snippets, but should explain the changes in detail and the reasoning behind them.
8. Use `gh` to merge the pull request.
9. Checkout the `main` branch and pull the latest changes to ensure you have the most up-to-date code.

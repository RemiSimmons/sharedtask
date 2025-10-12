# 🧪 Prompt #5 Testing Guide

## Testing URL
**Local Dev:** http://localhost:3000/project/38c25e43-6908-4187-93f4-5d8b363cbf84

## 🎯 What to Test

### **1. Visual Task States**
- [ ] **Unclaimed Tasks** (when logged in as owner):
  - Should show **orange left border**
  - Should have **light orange background**
  - Badge should say **"Draft"**
  
- [ ] **Partially Claimed Tasks**:
  - Should show **blue left border**
  - Should have **light blue background**
  - Badge should say **"In Progress"** with count (e.g., "2/5")
  
- [ ] **Full Tasks**:
  - Should show **green left border**
  - Should have **light green background**
  - Badge should say **"Complete"** with checkmark ✓

### **2. Edit Permissions (Owner View)**
**Test as project owner (aderemis@gmail.com):**
- [ ] Hover over **unclaimed task** → Should see **pencil icon** with tooltip "Add details"
- [ ] Click edit → Should open edit form
- [ ] Hover over **claimed task** → Should see **pencil icon** with tooltip "Edit task"
- [ ] Hover over task → Should see **trash icon** for delete

### **3. Edit Permissions (Participant View)**
**Test in incognito/different browser (not logged in or as different user):**
- [ ] Should **NOT see** any edit (pencil) buttons
- [ ] Should **NOT see** any delete (trash) buttons
- [ ] Should only see "Claim Task" or participant actions

### **4. Delete Confirmations**
**As owner:**
- [ ] Click delete on **unclaimed task** → Confirm says: "Delete [task name] permanently?"
- [ ] Click delete on **task with 2 participants** → Should say: "Delete [task name] permanently? This will affect 2 participants."

**As participant (your own name in claimed list):**
- [ ] Click ✕ next to your name → Confirm says: "Leave this task? You will be removed from [task name]."

### **5. Mobile Responsiveness**
**Resize browser to mobile (< 768px):**
- [ ] Task cards should have colored left borders
- [ ] Edit/delete buttons only visible to owner
- [ ] Badges show correctly (Draft/In Progress/Complete)
- [ ] Touch targets are large enough (48px min)

### **6. Status Badge Logic**
- [ ] **Unclaimed** + **Owner logged in** = "Draft" (orange)
- [ ] **Unclaimed** + **Not owner** = "Available" (gray)
- [ ] **1/5 spots filled** = "In Progress (4 spots left)" (blue)
- [ ] **5/5 spots filled** = "Complete" (green with checkmark)

## 🔍 Quick Visual Test Checklist

### Desktop View (Owner):
1. Open project page as owner
2. Check unclaimed tasks → Orange border + "Draft" badge
3. Hover task → See pencil + trash icons
4. Check claimed tasks → Blue/green borders
5. Try editing a task → Form should open

### Desktop View (Participant):
1. Open project page NOT logged in or as different user
2. Check unclaimed tasks → No orange border, says "Available"
3. Hover task → Should NOT see edit/delete buttons
4. Should only see claim/join options

### Mobile View:
1. Resize browser to < 768px
2. Task cards should stack vertically
3. Colored borders visible on left
4. Buttons appropriately sized for touch

## ✅ Expected Results Summary

| User Type | Unclaimed Tasks | Edit Visible? | Delete Visible? | Badge Color |
|-----------|----------------|---------------|-----------------|-------------|
| **Owner** | Orange border, "Draft" | ✅ Yes | ✅ Yes | Orange |
| **Participant** | No color, "Available" | ❌ No | ❌ No | Gray |
| **Anyone** | Partial fill (blue) | Owner only | Owner only | Blue |
| **Anyone** | Full (green) | Owner only | Owner only | Green |

## 🐛 Common Issues to Watch For

- [ ] Edit buttons showing for non-owners (should NOT happen)
- [ ] Wrong badge colors (Draft should be orange, not gray)
- [ ] Missing left border accents
- [ ] Delete confirmation not showing participant count
- [ ] Mobile touch targets too small (< 48px)

## 📸 Screenshot Checklist

If testing looks good, take screenshots of:
1. Desktop view with unclaimed tasks (orange "Draft" badge)
2. Desktop view with partially filled tasks (blue "In Progress")
3. Desktop view with full tasks (green "Complete")
4. Mobile view showing task cards with colored borders
5. Delete confirmation dialog showing participant count

---

**Ready to test!** Open http://localhost:3000/project/38c25e43-6908-4187-93f4-5d8b363cbf84 in your browser (make sure you're logged in as the project owner to see the full owner experience). 🚀

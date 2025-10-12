# 🧪 Prompt #6 Testing Guide: Date/Time Picker & Validation

## 📍 **Testing URLs**
- **Homepage (Project Creation)**: http://localhost:3000
- **Existing Project (Add Task)**: http://localhost:3000/project/38c25e43-6908-4187-93f4-5d8b363cbf84

---

## ✅ **Test 1: Date/Time Picker (Project Creation)**

### **Steps:**
1. Go to http://localhost:3000
2. Click "Create Project" or "Get Started"
3. Scroll to "📅 Event Details" section
4. Click on the "⏰ Date & Time" field

### **Expected Results:**
- [ ] Calendar popover opens
- [ ] Shows current month
- [ ] Yesterday and past dates are **grayed out** and unclickable
- [ ] Future dates are selectable
- [ ] Time input shows "18:00" (6:00 PM) by default
- [ ] Selected date shows as "Fri, Oct 15, 2025 at 6:00 PM" format

### **Test Cases:**
1. **Try to select yesterday** → Should be disabled
2. **Select a date 2 weeks from now** → Should update display
3. **Change time to 14:30** → Display shows "2:30 PM"
4. **Close and reopen** → Should remember selected date/time

---

## ✅ **Test 2: Task Title Validation (Add Task Button)**

### **Steps:**
1. Go to project page (logged in as owner)
2. Click "Add Task" button
3. Click in "Task Name" field

### **Expected Results:**

#### **Test Case A: Too Short (< 3 characters)**
- [ ] Type "AB"
- [ ] Counter shows "2/60 characters • Minimum 3 characters" (RED)
- [ ] Input has **red border**
- [ ] Submit button is **DISABLED**

#### **Test Case B: Valid (3-50 characters)**
- [ ] Type "ABC"
- [ ] Counter shows "3/60 characters" (GRAY)
- [ ] Input has **normal border**
- [ ] Submit button is **ENABLED**

#### **Test Case C: Warning (50-60 characters)**
- [ ] Type 52 characters
- [ ] Counter shows "52/60 characters" (ORANGE)
- [ ] Submit button still **ENABLED**

#### **Test Case D: At Limit (60 characters)**
- [ ] Try to type 61st character
- [ ] Input **blocks** the character
- [ ] Counter shows "60/60 characters"

---

## ✅ **Test 3: Description Field**

### **Steps:**
1. In Add Task dialog, go to "Description" field
2. Start typing

### **Expected Results:**
- [ ] Multi-line textarea (not single-line input)
- [ ] Counter shows "0/500 characters"
- [ ] Can type multiple lines with Enter key
- [ ] Counter updates in real-time
- [ ] At 500 characters, input blocks further typing
- [ ] Field is **optional** (can leave empty)

---

## ✅ **Test 4: Slots Validation (Project Creation)**

### **Steps:**
1. Go to http://localhost:3000
2. Create new project
3. Check "Allow Multiple Contributors" checkbox
4. Look at "Maximum contributors per task" field

### **Expected Results:**

#### **Test Case A: Out of Range (Low)**
- [ ] Try to type "0"
- [ ] Shows error: "Must be between 1 and 20" (RED)

#### **Test Case B: Out of Range (High)**
- [ ] Try to type "21"
- [ ] Shows error: "Must be between 1 and 20" (RED)

#### **Test Case C: Valid Range**
- [ ] Type "5"
- [ ] Shows: "Maximum number of people who can claim each task (1-20)" (GRAY)
- [ ] Default value is "1"

---

## ✅ **Test 5: Form Submission & Loading State**

### **Steps:**
1. Open Add Task dialog
2. Enter valid task name (3-60 chars)
3. Click "Add Task" button

### **Expected Results:**
- [ ] Button shows **animated spinner**
- [ ] Text changes to "Adding..."
- [ ] Button is **disabled** during submission
- [ ] On success:
  - Form clears
  - Dialog closes
  - Task appears in list immediately
- [ ] No error messages appear

---

## ✅ **Test 6: Error Messages**

### **Test Case A: Empty Title**
1. Open Add Task dialog
2. Click submit without typing
3. **Expected**: "Task name is required"

### **Test Case B: Too Short**
1. Type "AB"
2. Try to submit (button should be disabled)
3. **Expected**: Button disabled, no error modal

### **Test Case C: API Error**
1. Turn off internet
2. Try to submit valid task
3. **Expected**: Error message: "Failed to add task: [error]"

---

## ✅ **Test 7: Mobile Responsiveness**

### **Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" or similar

### **Expected Results:**

#### **Date Picker on Mobile:**
- [ ] Calendar is full-width
- [ ] Time input uses native time picker (clock icon)
- [ ] Touch targets are large enough (48px+)
- [ ] Easy to select dates with finger

#### **Add Task on Mobile:**
- [ ] Dialog is full-width (max 95vw)
- [ ] Text is larger (text-xl vs text-base)
- [ ] Buttons are taller (py-6 vs py-2)
- [ ] Character counters visible
- [ ] Submit button spans full width

---

## ✅ **Test 8: Keyboard Navigation**

### **Steps:**
1. Open Add Task dialog
2. Use **Tab** key to navigate

### **Expected Results:**
- [ ] Tab order: Task Name → Description → Submit → Cancel
- [ ] Can type in all fields via keyboard
- [ ] Enter key submits form (when valid)
- [ ] Esc key closes dialog
- [ ] Focus visible (blue outline)

---

## ✅ **Test 9: Character Counter Real-Time Updates**

### **Steps:**
1. Open Add Task dialog
2. Type slowly in Task Name field

### **Expected Results:**
- [ ] Counter updates **on every keystroke**
- [ ] Color changes:
  - 0-2 chars: RED
  - 3-50 chars: GRAY
  - 51-60 chars: ORANGE
- [ ] No lag or delay
- [ ] Counter doesn't "jump" or flicker

---

## ✅ **Test 10: Date Format Display**

### **Expected Formats:**

#### **In Picker:**
- Selected date: **"Fri, Oct 15, 2025 at 6:00 PM"**

#### **In Database (check network tab):**
- Stored as: **"2025-10-15T18:00:00.000Z"** (ISO 8601)

#### **Test:**
1. Open Network tab (F12 → Network)
2. Create project with date selected
3. Check POST request payload
4. **Expected**: `eventTime: "2025-10-15T18:00:00.000Z"`

---

## 🐛 **Common Issues to Watch For**

### **Date Picker:**
- [ ] Can you select yesterday? (Should NOT be able to)
- [ ] Does time default to 6:00 PM? (Should)
- [ ] Does format show AM/PM? (Should)
- [ ] Does calendar close after selection? (Should)

### **Validation:**
- [ ] Can you submit with 2-char title? (Should NOT)
- [ ] Does button disable/enable correctly? (Should)
- [ ] Do counters show correctly? (Should)
- [ ] Can you type beyond maxLength? (Should NOT)

### **Mobile:**
- [ ] Are buttons too small? (Should be 48px+ height)
- [ ] Is text readable? (Should be text-xl on mobile)
- [ ] Does native time picker appear? (Should on iOS/Android)

---

## 📸 **Screenshot Checklist**

If testing looks good, take screenshots of:

1. **Date/Time Picker** - Showing calendar + time input
2. **Task validation** - Red border with "2/60 characters" counter
3. **Valid task** - Normal state with enabled submit button
4. **Loading state** - Spinner with "Adding..." text
5. **Mobile view** - Add Task dialog on small screen
6. **Slots validation** - Error message for out-of-range value

---

## ✅ **Quick Visual Test Summary**

| Feature | What to See | Status |
|---------|-------------|--------|
| **Date Picker** | Calendar with future dates only | ⬜ |
| **Task Title < 3** | Red border + disabled button | ⬜ |
| **Task Title 3-60** | Normal + enabled button | ⬜ |
| **Task Title > 50** | Orange counter warning | ⬜ |
| **Description** | 500 char limit, multi-line | ⬜ |
| **Slots 1-20** | Valid range, default 1 | ⬜ |
| **Loading Spinner** | Animated spinner on submit | ⬜ |
| **Mobile Date Picker** | Full-width, touch-friendly | ⬜ |
| **Mobile Form** | Large text and buttons | ⬜ |

---

## 🚀 **Ready to Test!**

Open http://localhost:3000 and start testing! All features should work smoothly with proper validation and feedback. 🎉

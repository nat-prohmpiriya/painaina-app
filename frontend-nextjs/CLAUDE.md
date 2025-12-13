# don't use antd card component

# Notification Standards

## Global Notification System
- **ALWAYS** use the global notification system for user feedback
- **Import**: `import { useNotification } from '@/contexts/NotificationContext'`
- **Usage**: `const { showSuccess, showError, showWarning, showInfo } = useNotification()`

## Notification Guidelines
### When to Use
- **Success**: Successful operations (create, update, delete)
- **Error**: Failed operations, validation errors, API errors
- **Warning**: Important alerts, confirmations needed
- **Info**: General information, status updates

### Message Format
```typescript
// ✅ Good
showSuccess("Trip created successfully")
showError("Failed to create trip")

// ✅ With description
showSuccess("Trip Created", "Your trip has been saved and is ready to edit")
showError("Network Error", "Please check your connection and try again")

// ❌ Avoid generic messages
showError("Error occurred")
showSuccess("Success")
```

### Best Practices
- Use clear, actionable messages
- Include context when helpful
- Keep titles concise (under 50 chars)
- Use descriptions for additional details
- **NEVER** use console.log for user feedback
- **NEVER** use alert() or confirm() dialogs
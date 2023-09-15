# Scheduler

The application scheduler relies on the `schedulers` collection. Every object in that collection is retrieved by the scheduler and performs the proper action. The scheduler retrieves notifications that are not processed and the creation date no longer than two hours.

## Notification

A notification can be an email to be sent. This kind of notification MUST contain the `email` property, for instance:

```js
{
  email: {
    subject: 'The email subject',
    to: [{ firstName: 'First', lastName: 'Last', email: 'firstlast@email.com' }],
    content: {
      mime: 'text/plain',
      data: 'The email content'
    }
  }
}
```

If you want to send a `multipart/mixed`, replace the content object to array.

```js
{
  email: {
    subject: 'The email subject',
    to: [{ firstName: 'First', lastName: 'Last', email: 'firstlast@email.com' }],
    content: [
      {
        mime: 'text/plain',
        data: 'The email content'
      },
      {
        mime: 'text/plain',
        data: 'More content'
      }
    ]
  }
}
```

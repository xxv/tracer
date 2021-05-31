# Tracer 4215RN Client

### Install

```
$ npm install 
```

### Example
Run 

```
$ npm start 
```

and see test.js.

### Usage
See test.js. Create a triggering or non-triggering MPPT client
and use getData() to retrieve the data objects.

### Restrictions

This version sends only the A0 command to the Tracer, i.e. is
a monitoring clinet. The Tracer cannot be controlled using this
client.

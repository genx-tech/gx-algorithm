class Counter {
    static count = 0;
    static inc() { this.count++; }
  }
  class SubCounter extends Counter { }
  
  console.log(Counter.hasOwnProperty("count"));  // true
  console.log(SubCounter.hasOwnProperty("count"));  // false
  
  console.log(Counter.count); // 0, own property
  console.log(SubCounter.count); // 0, inherited
  
  Counter.inc();  // undefined
  console.log(Counter.count);  // 1, own property
  console.log(SubCounter.count);  // 1, inherited
  
  // ++ will read up the prototype chain and write an own property
  SubCounter.inc();
  
  console.log(Counter.hasOwnProperty("count"));  // true
  console.log(SubCounter.hasOwnProperty("count"));  // true
  
  console.log(Counter.count);  // 1, own property
  console.log(SubCounter.count);  // 2, own property
  
  Counter.inc(); Counter.inc();
  console.log(Counter.count);  // 3, own property
  console.log(SubCounter.count);  // 2, own property
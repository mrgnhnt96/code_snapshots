import 'dart:async';

class Counter {
  int _count = 0;
  Timer? _timer;

  // Constructor
  Counter() {
    print('Counter initialized');
  }

  // Method to start counting
  void start() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      _count++;
      print('Count: $_count');
    });
  }

  // Method to stop counting
  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  // Getter for current count
  int get count => _count;

  // Setter for count
  set count(int value) {
    if (value >= 0) {
      _count = value;
    }
  }
}

void main() async {
  final counter = Counter();
  counter.start();

  // Wait for 5 seconds
  await Future.delayed(Duration(seconds: 5));

  counter.stop();
  print('Final count: ${counter.count}');
}

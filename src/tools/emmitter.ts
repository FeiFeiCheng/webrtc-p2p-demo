/**
 * Event Emmitter
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2019-10-17 19:14:39
 */

interface Item {
  total: number;
  listener: Function;
}
export default class Emmitter {
  private events: {
    [key: string]: Item[];
  };

  public constructor() {
    this.events = {};
  }

  public on(key: string, listener: Function, total = -1) {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener not a function');
    }

    if (!this.events) {
      this.events = {};
    }

    if (!this.events[key]) {
      this.events[key] = [];
    }

    this.events[key].push({
      total,
      listener
    });
  }

  public once(key: string, listener: Function, total = 1) {
    this.on(key, listener, total);
  }

  public removeListener(key: string) {
    if (this.events[key]) {
      this.events[key].length = 0;
    }
  }

  public removeAllListener() {
    this.events = {};
  }

  public emmit<T>(key: string, ...args: T[]) {
    if (!this.events[key]) {
      return;
    }

    this.events[key].forEach((item, index: number) => {
      if (item.total === -1 || item.total >= 1 || typeof item.listener === 'function') {
        item.listener.apply(this, args);
      }

      if (item.total >= 1) {
        const total = this.events[key][index].total - 1;

        this.events[key][index].total = total;

        if (total === 0) {
          this.events[key][index].listener = () => {};
        }
      }
    });
  }
}

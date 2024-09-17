import EventEmitter from 'events';

const EventBus = new EventEmitter();

EventBus.setMaxListeners(0);

export default EventBus;
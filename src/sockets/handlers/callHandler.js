export class CallHandler {
  constructor(io, socket, userService) {
    this.io = io;
    this.socket = socket;
    this.userService = userService;
  }

  handleCallUser = ({ userToCall, signalData }) => {
    const caller = this.userService.getUser(this.socket.id);
    if (!caller) return;

    this.io.to(userToCall).emit('incoming-call', {
      signal: signalData,
      from: this.socket.id,
      callerName: caller.username
    });
  }

  handleAnswerCall = ({ to, signal }) => {
    const answerer = this.userService.getUser(this.socket.id);
    if (!answerer) return;

    this.io.to(to).emit('call-accepted', signal);
  }

  handleEndCall = ({ to }) => {
    const caller = this.userService.getUser(this.socket.id);
    if (!caller) return;

    this.io.to(to).emit('call-ended');
  }

  handleRejectCall = ({ to }) => {
    const rejector = this.userService.getUser(this.socket.id);
    if (!rejector) return;

    this.io.to(to).emit('call-rejected');
  }
} 
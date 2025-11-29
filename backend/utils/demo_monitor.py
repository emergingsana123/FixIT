import logging
from datetime import datetime
from pathlib import Path

class DemoMonitor:
    """Monitor demo execution and log critical events."""
    
    def __init__(self):
        self.log_file = Path(f"logs/demo_{datetime.now():%Y%m%d_%H%M%S}.log")
        self.log_file.parent.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('DemoMonitor')
        
        self.events = []
        self.start_time = None
    
    def start_demo(self):
        """Mark demo start."""
        self.start_time = datetime.now()
        self.logger.info("=== DEMO STARTED ===")
    
    def log_checkpoint(self, checkpoint: str, success: bool, details: str = ""):
        """Log checkpoint completion."""
        event = {
            "checkpoint": checkpoint,
            "success": success,
            "time": datetime.now(),
            "details": details
        }
        self.events.append(event)
        
        status = "✓" if success else "✗"
        self.logger.info(f"{status} {checkpoint}: {details}")
    
    def end_demo(self):
        """Mark demo end and generate report."""
        duration = (datetime.now() - self.start_time).total_seconds()
        success_rate = sum(1 for e in self.events if e['success']) / len(self.events) if self.events else 0
        
        self.logger.info("=== DEMO COMPLETE ===")
        self.logger.info(f"Duration: {duration:.1f}s")
        self.logger.info(f"Success Rate: {success_rate:.1%}")
        self.logger.info(f"Log file: {self.log_file}")
        
        return {
            "duration": duration,
            "success_rate": success_rate,
            "events": self.events
        }

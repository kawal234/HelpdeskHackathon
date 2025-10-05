const Ticket = require('../models/Ticket');

class SLAChecker {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
    }

    start(intervalMinutes = 5) {
        if (this.isRunning) {
            console.log('SLA checker is already running');
            return;
        }

        this.isRunning = true;
        this.intervalId = setInterval(async () => {
            await this.checkSLA();
        }, intervalMinutes * 60 * 1000);

        console.log(`SLA checker started (checking every ${intervalMinutes} minutes)`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('SLA checker stopped');
    }

    async checkSLA() {
        try {
            console.log('Running SLA check...');
            
            // Get all tickets that might have breached SLA
            const breachedTickets = await Ticket.findSlaBreached();
            
            if (breachedTickets.length > 0) {
                console.log(`Found ${breachedTickets.length} tickets with breached SLA`);
                
                // Update SLA breach status for all breached tickets
                for (const ticket of breachedTickets) {
                    await ticket.checkSlaBreach();
                }
            } else {
                console.log('No tickets with breached SLA found');
            }
        } catch (error) {
            console.error('Error during SLA check:', error);
        }
    }

    async checkSLAForTicket(ticketId) {
        try {
            const ticket = await Ticket.findById(ticketId);
            if (!ticket) {
                throw new Error('Ticket not found');
            }

            await ticket.checkSlaBreach();
            return ticket.slaBreached;
        } catch (error) {
            console.error('Error checking SLA for ticket:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalMinutes: this.intervalId ? 5 : null
        };
    }
}

module.exports = new SLAChecker();


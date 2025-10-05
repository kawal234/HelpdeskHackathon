const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function demo() {
    console.log('🚀 HelpDesk Mini API Demo\n');
    
    try {
        // 1. Health Check
        console.log('1. Health Check');
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running:', health.data.status);
        console.log('');

        // 2. Register a new user (or login if exists)
        console.log('2. Register a new user');
        const registerData = {
            username: 'demouser',
            email: 'demo@example.com',
            password: 'Demo123!',
            role: 'user'
        };
        
        let registerResponse;
        try {
            registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData, {
                headers: { 'Idempotency-Key': 'demo-register-1' }
            });
            console.log('✅ User registered:', registerResponse.data.user.username);
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️  User already exists, continuing...');
            } else {
                throw error;
            }
        }
        console.log('');

        // 3. Login
        console.log('3. Login');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'demo@example.com',
            password: 'Demo123!'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('');

        // 4. Create a ticket
        console.log('4. Create a ticket');
        const ticketData = {
            title: 'Demo API Issue',
            description: 'This is a demonstration ticket created via the API',
            priority: 'high'
        };
        
        const ticketResponse = await axios.post(`${BASE_URL}/api/tickets`, ticketData, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Idempotency-Key': 'demo-ticket-1'
            }
        });
        const ticketId = ticketResponse.data.ticket.id;
        console.log('✅ Ticket created:', ticketResponse.data.ticket.title);
        console.log('   SLA Due Date:', ticketResponse.data.ticket.slaDueDate);
        console.log('');

        // 5. Get all tickets
        console.log('5. Get all tickets');
        const ticketsResponse = await axios.get(`${BASE_URL}/api/tickets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Found', ticketsResponse.data.tickets.length, 'tickets');
        console.log('');

        // 6. Get specific ticket
        console.log('6. Get specific ticket');
        const specificTicket = await axios.get(`${BASE_URL}/api/tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Retrieved ticket:', specificTicket.data.ticket.title);
        console.log('   Comments:', specificTicket.data.comments.length);
        console.log('   History entries:', specificTicket.data.history.length);
        console.log('');

        // 7. Add a comment
        console.log('7. Add a comment');
        const commentResponse = await axios.post(`${BASE_URL}/api/tickets/${ticketId}/comments`, {
            content: 'This is a demo comment added via API'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Comment added with ID:', commentResponse.data.commentId);
        console.log('');

        // 8. Update ticket
        console.log('8. Update ticket');
        const updateResponse = await axios.patch(`${BASE_URL}/api/tickets/${ticketId}`, {
            status: 'in_progress',
            version: 1
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Ticket updated to:', updateResponse.data.ticket.status);
        console.log('');

        // 9. Search tickets
        console.log('9. Search tickets');
        const searchResponse = await axios.get(`${BASE_URL}/api/tickets/search?q=demo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Search found', searchResponse.data.tickets.length, 'tickets matching "demo"');
        console.log('');

        // 10. Get user profile
        console.log('10. Get user profile');
        const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ User profile:', profileResponse.data.user.username, '(' + profileResponse.data.user.role + ')');
        console.log('');

        console.log('🎉 Demo completed successfully!');
        console.log('\n📚 API Documentation: http://localhost:3000/api');
        console.log('🏥 Health Check: http://localhost:3000/health');

    } catch (error) {
        console.error('❌ Demo failed:', error.response?.data || error.message);
    }
}

// Run demo if this file is executed directly
if (require.main === module) {
    demo();
}

module.exports = demo;

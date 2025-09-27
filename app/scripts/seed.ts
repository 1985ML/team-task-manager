
import { PrismaClient, TaskStatus, Priority, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Clear existing data in reverse dependency order
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Create default test account (hidden from user)
  const defaultTestPassword = await bcrypt.hash('johndoe123', 12)
  const defaultTestUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: defaultTestPassword,
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      role: 'ADMIN',
      isActive: true
    }
  })

  // Create sample users for testing
  const alicePassword = await bcrypt.hash('password123', 12)
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: alicePassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      name: 'Alice Johnson',
      role: 'MANAGER',
      isActive: true
    }
  })

  const bobPassword = await bcrypt.hash('password123', 12)
  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: bobPassword,
      firstName: 'Bob',
      lastName: 'Smith',
      name: 'Bob Smith',
      role: 'MEMBER',
      isActive: true
    }
  })

  const carolPassword = await bcrypt.hash('password123', 12)
  const carol = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      password: carolPassword,
      firstName: 'Carol',
      lastName: 'Davis',
      name: 'Carol Davis',
      role: 'MEMBER',
      isActive: true
    }
  })

  console.log('Created users:', {
    defaultTest: defaultTestUser.email,
    alice: alice.email,
    bob: bob.email,
    carol: carol.email
  })

  // Create sample teams
  const developmentTeam = await prisma.team.create({
    data: {
      name: 'Development Team',
      description: 'Core product development and engineering',
      color: '#3B82F6',
      createdById: alice.id,
      isActive: true
    }
  })

  const designTeam = await prisma.team.create({
    data: {
      name: 'Design Team',
      description: 'UI/UX design and visual design',
      color: '#8B5CF6',
      createdById: alice.id,
      isActive: true
    }
  })

  const marketingTeam = await prisma.team.create({
    data: {
      name: 'Marketing Team',
      description: 'Marketing campaigns and growth',
      color: '#10B981',
      createdById: defaultTestUser.id,
      isActive: true
    }
  })

  console.log('Created teams:', {
    development: developmentTeam.name,
    design: designTeam.name,
    marketing: marketingTeam.name
  })

  // Create team memberships
  const teamMemberships = await Promise.all([
    // Default test user in all teams as owner/admin
    prisma.teamMember.create({
      data: {
        userId: defaultTestUser.id,
        teamId: developmentTeam.id,
        role: 'ADMIN'
      }
    }),
    prisma.teamMember.create({
      data: {
        userId: defaultTestUser.id,
        teamId: designTeam.id,
        role: 'ADMIN'
      }
    }),
    prisma.teamMember.create({
      data: {
        userId: defaultTestUser.id,
        teamId: marketingTeam.id,
        role: 'OWNER'
      }
    }),

    // Alice as owner/admin of her teams
    prisma.teamMember.create({
      data: {
        userId: alice.id,
        teamId: developmentTeam.id,
        role: 'OWNER'
      }
    }),
    prisma.teamMember.create({
      data: {
        userId: alice.id,
        teamId: designTeam.id,
        role: 'OWNER'
      }
    }),

    // Bob as member
    prisma.teamMember.create({
      data: {
        userId: bob.id,
        teamId: developmentTeam.id,
        role: 'MEMBER'
      }
    }),
    prisma.teamMember.create({
      data: {
        userId: bob.id,
        teamId: marketingTeam.id,
        role: 'MEMBER'
      }
    }),

    // Carol as member
    prisma.teamMember.create({
      data: {
        userId: carol.id,
        teamId: designTeam.id,
        role: 'MEMBER'
      }
    }),
    prisma.teamMember.create({
      data: {
        userId: carol.id,
        teamId: marketingTeam.id,
        role: 'MEMBER'
      }
    })
  ])

  console.log(`Created ${teamMemberships.length} team memberships`)

  // Create sample tasks
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const sampleTasks = [
    {
      title: 'Implement user authentication',
      description: 'Set up NextAuth.js with email/password authentication and user roles',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: lastWeek,
      completedAt: lastWeek,
      createdById: alice.id,
      assignedToId: bob.id,
      teamId: developmentTeam.id,
      position: 1
    },
    {
      title: 'Design task management interface',
      description: 'Create wireframes and mockups for the task management dashboard',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: tomorrow,
      createdById: alice.id,
      assignedToId: carol.id,
      teamId: designTeam.id,
      position: 2
    },
    {
      title: 'Setup database schema',
      description: 'Design and implement Prisma schema for tasks, teams, and users',
      status: TaskStatus.DONE,
      priority: Priority.URGENT,
      dueDate: lastWeek,
      completedAt: lastWeek,
      createdById: alice.id,
      assignedToId: defaultTestUser.id,
      teamId: developmentTeam.id,
      position: 3
    },
    {
      title: 'Create landing page content',
      description: 'Write compelling copy and gather assets for the marketing landing page',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: nextWeek,
      createdById: defaultTestUser.id,
      assignedToId: bob.id,
      teamId: marketingTeam.id,
      position: 4
    },
    {
      title: 'Test task assignment workflow',
      description: 'Verify that task assignment and notifications work correctly',
      status: TaskStatus.REVIEW,
      priority: Priority.HIGH,
      dueDate: tomorrow,
      createdById: alice.id,
      assignedToId: bob.id,
      teamId: developmentTeam.id,
      position: 5
    },
    {
      title: 'Design team collaboration features',
      description: 'Plan UI/UX for team member management and collaboration tools',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: nextWeek,
      createdById: alice.id,
      assignedToId: carol.id,
      teamId: designTeam.id,
      position: 6
    },
    {
      title: 'Implement task filtering',
      description: 'Add filters for task status, priority, and due date',
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      createdById: alice.id,
      assignedToId: bob.id,
      teamId: developmentTeam.id,
      position: 7
    },
    {
      title: 'Setup analytics tracking',
      description: 'Integrate analytics to track user engagement and feature usage',
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      dueDate: nextWeek,
      createdById: defaultTestUser.id,
      assignedToId: carol.id,
      teamId: marketingTeam.id,
      position: 8
    }
  ]

  const createdTasks = await Promise.all(
    sampleTasks.map(task => 
      prisma.task.create({
        data: task
      })
    )
  )

  console.log(`Created ${createdTasks.length} sample tasks`)

  // Create sample comments
  const sampleComments = [
    {
      content: 'Authentication is working well! I tested with multiple user roles.',
      userId: bob.id,
      taskId: createdTasks[0].id
    },
    {
      content: 'Great work on this! The login flow is smooth and intuitive.',
      userId: alice.id,
      taskId: createdTasks[0].id
    },
    {
      content: 'I\'ve created the initial wireframes. Will share them for review soon.',
      userId: carol.id,
      taskId: createdTasks[1].id
    },
    {
      content: 'The database schema looks comprehensive. All relationships are properly set up.',
      userId: alice.id,
      taskId: createdTasks[2].id
    },
    {
      content: 'I need some clarification on the target audience for the landing page.',
      userId: bob.id,
      taskId: createdTasks[3].id
    },
    {
      content: 'The assignment workflow works as expected. Ready for final review.',
      userId: bob.id,
      taskId: createdTasks[4].id
    }
  ]

  const createdComments = await Promise.all(
    sampleComments.map(comment =>
      prisma.comment.create({
        data: comment
      })
    )
  )

  console.log(`Created ${createdComments.length} sample comments`)

  // Create sample notifications
  const sampleNotifications = [
    {
      title: 'New Task Assigned',
      message: 'You have been assigned to "Design task management interface"',
      type: NotificationType.TASK_ASSIGNED,
      fromId: alice.id,
      toId: carol.id,
      entityId: createdTasks[1].id,
      entityType: 'task'
    },
    {
      title: 'Task Completed',
      message: 'Bob Smith completed "Implement user authentication"',
      type: NotificationType.TASK_COMPLETED,
      fromId: bob.id,
      toId: alice.id,
      entityId: createdTasks[0].id,
      entityType: 'task'
    },
    {
      title: 'New Task Assigned',
      message: 'You have been assigned to "Create landing page content"',
      type: NotificationType.TASK_ASSIGNED,
      fromId: defaultTestUser.id,
      toId: bob.id,
      entityId: createdTasks[3].id,
      entityType: 'task'
    },
    {
      title: 'Task Ready for Review',
      message: 'Bob Smith moved "Test task assignment workflow" to review',
      type: NotificationType.INFO,
      fromId: bob.id,
      toId: alice.id,
      entityId: createdTasks[4].id,
      entityType: 'task'
    }
  ]

  const createdNotifications = await Promise.all(
    sampleNotifications.map(notification =>
      prisma.notification.create({
        data: notification
      })
    )
  )

  console.log(`Created ${createdNotifications.length} sample notifications`)

  console.log('\nDatabase seed completed successfully!')
  console.log('\nSample Users Created:')
  console.log('- john@doe.com / johndoe123 (Admin - for testing only)')
  console.log('- alice@example.com / password123 (Manager)')
  console.log('- bob@example.com / password123 (Member)')
  console.log('- carol@example.com / password123 (Member)')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

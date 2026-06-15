import mongoose from 'mongoose';
import { Response } from 'express';
import Notification from '../models/Notification.ts';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 */
export const getNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    
    if (mongoose.connection.readyState !== 1) {
       return res.json([
         {
           _id: 'mock_notify_1',
           title: 'Exposed SSH Port',
           message: 'Security Group sg-0a2b3c4d5 has SSH port 22 open to the world.',
           type: 'security',
           severity: 'Critical',
           read: false,
           createdAt: new Date()
         },
         {
           _id: 'mock_notify_2',
           title: 'Public S3 Bucket Detected',
           message: 'S3 bucket s3-bucket-customer-data is publicly accessible.',
           type: 'security',
           severity: 'Critical',
           read: false,
           createdAt: new Date(Date.now() - 3600000)
         },
         {
           _id: 'mock_notify_3',
           title: 'Potential Cost Savings',
           message: 'ML recommendations generated 3 new rightsizing targets.',
           type: 'cost',
           severity: 'Info',
           read: true,
           createdAt: new Date(Date.now() - 7200000)
         }
       ]);
    }
    
    let notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);
    
    if (notifications.length === 0) {
      notifications = await Notification.insertMany([
        {
          userId,
          title: 'Welcome to CloudPilot AI',
          message: 'Your platform is ready. Connect your AWS account to begin scanning.',
          type: 'system',
          severity: 'Info',
          read: false
        }
      ]);
    }
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req: any, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
};
